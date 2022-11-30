//SPDX-License-Identifier: MIT
pragma solidity <=0.8.17;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../contracts/interfaces/PegswapInterface.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract VRFBalancer is Pausable, AutomationCompatibleInterface {
    address public owner;
    address public _tenantOwner;
    uint256 public lastTimeStamp;
    VRFCoordinatorV2Interface public COORDINATOR;
    LinkTokenInterface public ERC677LINK;
    IERC20 ERC20LINK;
    IERC20 ERC20ASSET;
    address public keeperRegistryAddress;
    uint256 public minWaitPeriodSeconds;
    address public dexAddress;
    uint256 contractLINKBalance;
    address public ERC20AssetAddress;
    uint64[] private s_watchList;
    uint256 private constant MIN_GAS_FOR_TRANSFER = 55_000;
    PegswapInterface pegSwapRouter;
    IUniswapV2Router02 DEX_ROUTER;
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
    event ContractLINKBalanceUpdated(
        uint256 oldContractLINKBalance,
        uint256 newContractLINKBalance
    );
    event ERC20AssetAddressUpdated(
        address oldERC20AssetAddress,
        address newERC20AssetAddress
    );

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
        setLinkTokenAddress(_linkTokenAddress);
        setVRFCoordinatorV2Address(_coordinatorAddress);
        setKeeperRegistryAddress(_keeperRegistryAddress);
        setMinWaitPeriodSeconds(_minWaitPeriodSeconds);
        setDEXAddress(_dexAddress);
        setContractLINKBalance(_linkContractBalance);
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
                contractBalance >= target.topUpAmountJuels &&
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

        // swap asset for LINK
        if (needsPegswap) {
            dexSwap(
                address(ERC20ASSET),
                address(ERC20LINK),
                ERC20ASSET.balanceOf(address(this))
            );
            pegSwap();
        } else {
            dexSwap(
                address(ERC20ASSET),
                address(ERC677LINK),
                ERC20ASSET.balanceOf(address(this))
            );
        }
        // top up subscriptions
        topUp(needsFunding);
    }

    // Setters

    /**
     * @notice Sets the VRF coordinator address.
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

    function setLinkTokenAddress(address linkTokenAddress) public onlyOwner {
        require(linkTokenAddress != address(0));
        if (
            linkTokenAddress == BNB_LINK_ERC677 ||
            linkTokenAddress == POLYGON_LINK_ERC677
        ) {
            needsPegswap = true;
            if (linkTokenAddress == BNB_LINK_ERC677) {
                ERC20LINK = IERC20(BNB_LINK_ERC20);
            } else {
                ERC20LINK = IERC20(POLYGON_LINK_ERC20);
            }

            ERC677LINK = LinkTokenInterface(linkTokenAddress);
            emit LinkTokenAddressUpdated(address(ERC20LINK), linkTokenAddress);
        } else {
            emit LinkTokenAddressUpdated(address(ERC677LINK), linkTokenAddress);
            ERC677LINK = LinkTokenInterface(linkTokenAddress);
        }
    }

    function setMinWaitPeriodSeconds(uint256 period) public onlyOwner {
        emit MinWaitPeriodUpdated(minWaitPeriodSeconds, period);
        minWaitPeriodSeconds = period;
    }

    function setDEXAddress(address _dexAddress) public onlyOwner {
        require(_dexAddress != address(0));
        emit DEXAddressUpdated(dexAddress, _dexAddress);
        DEX_ROUTER = IUniswapV2Router02(_dexAddress);
    }

    function setContractLINKBalance(uint256 _amount) public onlyOwner {
        require(_amount > 0);
        emit ContractLINKBalanceUpdated(contractLINKBalance, _amount);
        contractLINKBalance = _amount;
    }

    function setERC20AssetAddress(address _assetAddress) public onlyOwner {
        require(_assetAddress != address(0));
        emit ERC20AssetAddressUpdated(ERC20AssetAddress, _assetAddress);
        ERC20AssetAddress = _assetAddress;
    }

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
     */
    function isPaused() external view onlyOwner {
        paused();
    }

    function withdraw(uint256 amount, address payable payee)
        external
        onlyOwner
    {
        require(payee != address(0));
        emit FundsWithdrawn(amount, payee);
        ERC677LINK.transfer(payee, amount);
    }

    function checkContractLINKBalance() public view returns (uint256) {
        return ERC677LINK.balanceOf(address(this));
    }

    // Dex functions
    function dexSwap(
        address _fromToken,
        address _toToken,
        uint256 _amount
    ) internal returns (uint256) {
        if (_fromToken == _toToken) {
            return _amount;
        }
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
        return amounts[1];
    }

    // PegSwap functions

    function pegSwap() internal onlyOwner whenNotPaused {
        require(needsPegswap, "No pegswap needed");
        pegSwapRouter.swap(
            ERC20LINK.balanceOf(address(this)),
            address(ERC20LINK),
            address(ERC677LINK)
        );
    }

    function setPegSwapRouter(address _pegSwapRouter) external onlyOwner {
        require(_pegSwapRouter != address(0));
        emit PegswapRouterUpdated(address(pegSwapRouter), _pegSwapRouter);
        pegSwapRouter = PegswapInterface(_pegSwapRouter);
    }

    function getPegSwapRouter() external view returns (address) {
        return address(pegSwapRouter);
    }
}
