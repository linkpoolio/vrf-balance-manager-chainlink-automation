//SPDX-License-Identifier: MIT
pragma solidity <=0.8.17;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../contracts/interfaces/PegswapInterface.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "hardhat/console.sol";

/**
 * @title VRFBalancer
 * @notice Creates automation for vrf subscriptions
 * @dev The _linkTokenAddress in constructor is the ERC677 LINK token address of the network
 */
contract VRFBalancer is Pausable, AutomationCompatibleInterface {
    VRFCoordinatorV2Interface public COORDINATOR;
    LinkTokenInterface public ERC677LINK;
    IERC20 ERC20LINK;
    IERC20 ERC20ASSET;
    PegswapInterface pegSwapRouter;
    IUniswapV2Router02 DEX_ROUTER;
    address public owner;
    address public keeperRegistryAddress;
    uint256 public minWaitPeriodSeconds;
    address public dexAddress;
    uint256 contractLINKMinBalance;
    address public ERC20AssetAddress;
    uint64[] private s_watchList;
    uint256 private constant MIN_GAS_FOR_TRANSFER = 55_000;
    address[] public erc20LINKAddresses;
    address[] public erc677LINKAddresses;

    bool public needsPegswap;

    // LINK addresses by network ID
    address private constant BNB_LINK_ERC677 =
        0x404460C6A5EdE2D891e8297795264fDe62ADBB75;
    address private constant BNB_LINK_ERC20 =
        0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD;
    address private constant POLYGON_LINK_ERC20 =
        0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39;
    address private constant POLYGON_LINK_ERC677 =
        0xb0897686c545045aFc77CF20eC7A532E3120E0F1;

    struct Target {
        bool isActive;
        uint96 minBalanceJuels;
        uint96 topUpAmountJuels;
        uint56 lastTopUpTimestamp;
    }

    mapping(uint64 => Target) internal s_targets;

    event FundsAdded(uint256 amountAdded, uint256 newBalance, address sender);
    event FundsWithdrawn(uint256 amountWithdrawn, address payee);
    event TopUpSucceeded(uint64 indexed subscriptionId);
    event TopUpFailed(uint64 indexed subscriptionId);
    event KeeperRegistryAddressUpdated(address oldAddress, address newAddress);
    event VRFCoordinatorV2AddressUpdated(
        address oldAddress,
        address newAddress
    );
    event LinkTokenAddressUpdated(address oldAddress, address newAddress);
    event MinWaitPeriodUpdated(
        uint256 oldMinWaitPeriod,
        uint256 newMinWaitPeriod
    );
    event PegswapRouterUpdated(
        address oldPegswapRouter,
        address newPegswapRouter
    );
    event DEXAddressUpdated(address oldDEXAddress, address newDEXAddress);
    event ContractLINKMinBalanceUpdated(
        uint256 oldContractLINKBalance,
        uint256 newContractLINKBalance
    );
    event ERC20AssetAddressUpdated(
        address oldERC20AssetAddress,
        address newERC20AssetAddress
    );
    event PegSwapSuccess(uint256 amount, address from, address to);
    event DexSwapSuccess(uint256 amount, address from, address to);

    // Errors

    error Unauthorized();
    error OnlyKeeperRegistry();
    error InvalidWatchList();
    error DuplicateSubcriptionId(uint64 duplicate);

    // Modifiers

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Unauthorized();
        }
        _;
    }

    modifier onlyKeeperRegistry() {
        if (msg.sender != keeperRegistryAddress) {
            revert OnlyKeeperRegistry();
        }
        _;
    }

    constructor(
        address _linkTokenAddress,
        address _coordinatorAddress,
        address _keeperRegistryAddress,
        uint256 _minWaitPeriodSeconds,
        address _dexAddress,
        uint256 _linkContractBalance,
        address _erc20Asset
    ) {
        owner = msg.sender;
        _setERC20LinkAddresses();
        setLinkTokenAddress(_linkTokenAddress);
        setVRFCoordinatorV2Address(_coordinatorAddress);
        setKeeperRegistryAddress(_keeperRegistryAddress);
        setMinWaitPeriodSeconds(_minWaitPeriodSeconds);
        setDEXAddress(_dexAddress);
        setContractLINKMinBalance(_linkContractBalance);
        setERC20AssetAddress(_erc20Asset);
    }

    function setWatchList(
        uint64[] calldata subscriptionIds,
        uint96[] calldata minBalancesJuels,
        uint96[] calldata topUpAmountsJuels
    ) external onlyOwner {
        if (
            subscriptionIds.length != minBalancesJuels.length ||
            subscriptionIds.length != topUpAmountsJuels.length
        ) {
            revert InvalidWatchList();
        }
        uint64[] memory oldWatchList = s_watchList;
        for (uint256 idx = 0; idx < oldWatchList.length; idx++) {
            s_targets[oldWatchList[idx]].isActive = false;
        }
        for (uint256 idx = 0; idx < subscriptionIds.length; idx++) {
            if (s_targets[subscriptionIds[idx]].isActive) {
                revert DuplicateSubcriptionId(subscriptionIds[idx]);
            }
            if (subscriptionIds[idx] == 0) {
                revert InvalidWatchList();
            }
            if (topUpAmountsJuels[idx] == 0) {
                revert InvalidWatchList();
            }
            if (topUpAmountsJuels[idx] <= minBalancesJuels[idx]) {
                revert InvalidWatchList();
            }
            s_targets[subscriptionIds[idx]] = Target({
                isActive: true,
                minBalanceJuels: minBalancesJuels[idx],
                topUpAmountJuels: topUpAmountsJuels[idx],
                lastTopUpTimestamp: 0
            });
        }
        s_watchList = subscriptionIds;
    }

    function getUnderfundedSubscriptions()
        public
        view
        returns (uint64[] memory)
    {
        uint64[] memory watchList = s_watchList;
        uint64[] memory needsFunding = new uint64[](watchList.length);
        uint256 count = 0;
        uint256 minWaitPeriod = minWaitPeriodSeconds;
        uint256 contractBalance = ERC677LINK.balanceOf(address(this));
        Target memory target;
        for (uint256 idx = 0; idx < watchList.length; idx++) {
            target = s_targets[watchList[idx]];
            (uint96 subscriptionBalance, , , ) = COORDINATOR.getSubscription(
                watchList[idx]
            );
            if (
                target.lastTopUpTimestamp + minWaitPeriod <= block.timestamp &&
                subscriptionBalance < target.minBalanceJuels
            ) {
                needsFunding[count] = watchList[idx];
                count++;
                contractBalance -= target.topUpAmountJuels;
            }
        }
        if (count != watchList.length) {
            assembly {
                mstore(needsFunding, count)
            }
        }
        return needsFunding;
    }

    function topUp(uint64[] memory needsFunding) public whenNotPaused {
        uint256 _minWaitPeriodSeconds = minWaitPeriodSeconds;
        uint256 contractBalance = ERC677LINK.balanceOf(address(this));
        Target memory target;
        for (uint256 idx = 0; idx < needsFunding.length; idx++) {
            target = s_targets[needsFunding[idx]];
            (uint96 subscriptionBalance, , , ) = COORDINATOR.getSubscription(
                needsFunding[idx]
            );
            if (
                target.isActive &&
                target.lastTopUpTimestamp + _minWaitPeriodSeconds <=
                block.timestamp &&
                subscriptionBalance < target.minBalanceJuels &&
                contractBalance >= target.topUpAmountJuels
            ) {
                bool success = ERC677LINK.transferAndCall(
                    address(COORDINATOR),
                    target.topUpAmountJuels,
                    abi.encode(needsFunding[idx])
                );
                if (success) {
                    s_targets[needsFunding[idx]].lastTopUpTimestamp = uint56(
                        block.timestamp
                    );
                    emit TopUpSucceeded(needsFunding[idx]);
                } else {
                    emit TopUpFailed(needsFunding[idx]);
                }
            }
            if (gasleft() < MIN_GAS_FOR_TRANSFER) {
                return;
            }
        }
    }

    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        override
        whenNotPaused
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint64[] memory needsFunding = getUnderfundedSubscriptions();
        upkeepNeeded = needsFunding.length > 0;
        performData = abi.encode(needsFunding);
        return (upkeepNeeded, performData);
    }

    function performUpkeep(bytes calldata performData)
        external
        override
        onlyKeeperRegistry
        whenNotPaused
    {
        uint64[] memory needsFunding = abi.decode(performData, (uint64[]));
        if (needsFunding.length > 0) {
            // swap asset for LINK
            if (needsPegswap) {
                _dexSwap(
                    address(ERC20ASSET),
                    address(ERC20LINK),
                    ERC20ASSET.balanceOf(address(this))
                );
                _pegSwap();
            } else {
                _dexSwap(
                    address(ERC20ASSET),
                    address(ERC677LINK),
                    ERC20ASSET.balanceOf(address(this))
                );
            }
            // top up subscriptions
            topUp(needsFunding);
        }
    }

    /**
     * @notice Sets the VRF coordinator address.
     * @param coordinatorAddress The address of the VRF coordinator.
     */
    function setVRFCoordinatorV2Address(address coordinatorAddress)
        public
        onlyOwner
    {
        require(coordinatorAddress != address(0));
        emit VRFCoordinatorV2AddressUpdated(
            address(COORDINATOR),
            coordinatorAddress
        );
        COORDINATOR = VRFCoordinatorV2Interface(coordinatorAddress);
    }

    /**
     * @notice Sets the keeper registry address.
     * @param _keeperRegistryAddress The address of the keeper registry.
     */
    function setKeeperRegistryAddress(address _keeperRegistryAddress)
        public
        onlyOwner
    {
        require(_keeperRegistryAddress != address(0));
        emit KeeperRegistryAddressUpdated(
            keeperRegistryAddress,
            _keeperRegistryAddress
        );
        keeperRegistryAddress = _keeperRegistryAddress;
    }

    /**
     * @notice Sets the LINK token address.
     * @param _linkTokenAddress The address of the LINK token.
     */
    function setLinkTokenAddress(address _linkTokenAddress) public onlyOwner {
        require(_linkTokenAddress != address(0));
        if (
            _linkTokenAddress == BNB_LINK_ERC677 ||
            _linkTokenAddress == POLYGON_LINK_ERC677
        ) {
            needsPegswap = true;
            if (_linkTokenAddress == BNB_LINK_ERC677) {
                ERC20LINK = IERC20(BNB_LINK_ERC20);
            } else {
                ERC20LINK = IERC20(POLYGON_LINK_ERC20);
            }

            ERC677LINK = LinkTokenInterface(_linkTokenAddress);
            emit LinkTokenAddressUpdated(address(ERC20LINK), _linkTokenAddress);
        } else {
            emit LinkTokenAddressUpdated(
                address(ERC677LINK),
                _linkTokenAddress
            );
            ERC677LINK = LinkTokenInterface(_linkTokenAddress);
        }
    }

    /**
     * @notice Sets the minimum wait period between top up checks.
     * @param _period The minimum wait period in seconds.
     */
    function setMinWaitPeriodSeconds(uint256 _period) public onlyOwner {
        emit MinWaitPeriodUpdated(minWaitPeriodSeconds, _period);
        minWaitPeriodSeconds = _period;
    }

    /**
     * @notice Sets the decentralized exchange address.
     * @param _dexAddress The address of the decentralized exchange.
     * @dev The decentralized exchange must support the uniswap v2 router interface.
     */
    function setDEXAddress(address _dexAddress) public onlyOwner {
        require(_dexAddress != address(0));
        emit DEXAddressUpdated(dexAddress, _dexAddress);
        DEX_ROUTER = IUniswapV2Router02(_dexAddress);
    }

    /**
     * @notice Sets the minimum LINK balance the contract should have.
     * @param _amount The minimum LINK balance in wei.
     */
    function setContractLINKMinBalance(uint256 _amount) public onlyOwner {
        require(_amount > 0);
        emit ContractLINKMinBalanceUpdated(contractLINKMinBalance, _amount);
        contractLINKMinBalance = _amount;
    }

    /**
     * @notice Sets the address of the ERC20 asset being traded.
     * @param _assetAddress The address of the ERC20 asset.
     **/
    function setERC20AssetAddress(address _assetAddress) public onlyOwner {
        require(_assetAddress != address(0));
        emit ERC20AssetAddressUpdated(ERC20AssetAddress, _assetAddress);
        ERC20AssetAddress = _assetAddress;
    }

    /**
     * @notice Gets the ERC677 LINK balance of the contract.
     * @return uint256 The LINK balance in wei.
     **/
    function getContractLinkBalance() public view returns (uint256) {
        return ERC677LINK.balanceOf(address(this));
    }

    /**
     * @notice Pause to prevent executing performUpkeep.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Check contract status.
     * @return bool
     */
    function isPaused() external view returns (bool) {
        return paused();
    }

    function withdraw(uint256 amount, address payable payee)
        external
        onlyOwner
    {
        require(payee != address(0));
        emit FundsWithdrawn(amount, payee);
        ERC677LINK.transfer(payee, amount);
    }

    function dexSwap(
        address _fromToken,
        address _toToken,
        uint256 _amount
    ) public onlyOwner {
        _dexSwap(_fromToken, _toToken, _amount);
    }

    /**
     * @notice Uses the Uniswap Clone contract router to swap ERC20 for ERC20/ERC677 LINK.
     * @param _fromToken Token address sending to swap.
     * @param _toToken Token address receiving from swap.
     * @param _amount Total tokens sending to swap.
     */
    function _dexSwap(
        address _fromToken,
        address _toToken,
        uint256 _amount
    ) internal whenNotPaused {
        address[] memory path = new address[](2);
        path[0] = _fromToken;
        path[1] = _toToken;
        uint256[] memory amounts = DEX_ROUTER.swapExactTokensForTokens(
            _amount,
            1,
            path,
            address(this),
            block.timestamp
        );
        emit DexSwapSuccess(amounts[1], _fromToken, _toToken);
    }

    /**
     * @notice Publuc function to call the private _pegSwap function.
     */
    function pegSwap() external onlyOwner {
        _pegSwap();
    }

    /**
     * @notice Uses the PegSwap contract to swap ERC20 LINK for ERC677 LINK.
     */
    function _pegSwap() internal whenNotPaused {
        require(needsPegswap, "No pegswap needed");
        pegSwapRouter.swap(
            ERC20LINK.balanceOf(address(this)),
            address(ERC20LINK),
            address(ERC677LINK)
        );
        emit PegSwapSuccess(
            ERC677LINK.balanceOf(address(this)),
            address(ERC20LINK),
            address(ERC677LINK)
        );
    }

    /**
     * @notice Sets PegSwap router address.
     * @param _pegSwapRouter The address of the PegSwap router.
     */
    function setPegSwapRouter(address _pegSwapRouter) external onlyOwner {
        require(_pegSwapRouter != address(0));
        emit PegswapRouterUpdated(address(pegSwapRouter), _pegSwapRouter);
        pegSwapRouter = PegswapInterface(_pegSwapRouter);
    }

    /**
     * @notice Gets PegSwap router address.
     * @return The address of the PegSwap router.
     */
    function getPegSwapRouter() external view returns (address) {
        return address(pegSwapRouter);
    }

    /**
     * @notice Approves dex to spend ERC20 asset.
     * @param _token The address of the ERC20 asset.
     * @param _to The address of the dex router.
     * @param _amount The amount to approve.
     */
    function approveAmount(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        IERC20(_token).approve(_to, _amount);
    }

    /**
     * @notice Checks allowance of dex for ERC20 asset.
     * @param _asset The address of the ERC20 asset.
     * @param _router The address of the dex router.
     * @return uint256 The allowance amount.
     */
    function getAllowanceAmount(address _asset, address _router)
        external
        view
        returns (uint256)
    {
        return IERC20(_asset).allowance(address(this), address(_router));
    }

    function _setERC20LinkAddresses() internal {
        erc20LINKAddresses.push(BNB_LINK_ERC20);
        erc20LINKAddresses.push(POLYGON_LINK_ERC20);
    }

    function addERC20LinkAddress(address _address) external onlyOwner {
        require(_address != address(0));
        erc20LINKAddresses.push(_address);
    }
}
