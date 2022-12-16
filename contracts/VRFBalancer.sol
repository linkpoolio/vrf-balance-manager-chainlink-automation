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
    uint64[] private s_watchList;
    uint256 private constant MIN_GAS_FOR_TRANSFER = 55_000;

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
        uint256 minBalance;
        uint256 topUpAmount;
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
    event WatchListUpdated(uint64[] oldSubs, uint64[] newSubs);

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
        setContractLINKMinBalance(_linkContractBalance);
        setERC20Asset(_erc20Asset);
    }

    /**
     * @notice Sets the VRF subscriptions to watch for, along with min balnces and topup amounts.
     * @param _subscriptionIds The subscription IDs to watch.
     * @param _minBalances The minimum balances to maintain for each subscription.
     * @param _topUpAmounts The amount to top up each subscription by when it falls below the minimum.
     * @dev The arrays must be the same length.
     */
    function setWatchList(
        uint64[] calldata _subscriptionIds,
        uint256[] calldata _minBalances,
        uint256[] calldata _topUpAmounts
    ) external onlyOwner {
        if (
            _subscriptionIds.length != _minBalances.length ||
            _subscriptionIds.length != _topUpAmounts.length
        ) {
            revert InvalidWatchList();
        }
        uint64[] memory oldWatchList = s_watchList;
        for (uint256 idx = 0; idx < oldWatchList.length; idx++) {
            s_targets[oldWatchList[idx]].isActive = false;
        }
        for (uint256 idx = 0; idx < _subscriptionIds.length; idx++) {
            if (s_targets[_subscriptionIds[idx]].isActive) {
                revert DuplicateSubcriptionId(_subscriptionIds[idx]);
            }
            if (_subscriptionIds[idx] == 0) {
                revert InvalidWatchList();
            }
            if (_topUpAmounts[idx] == 0) {
                revert InvalidWatchList();
            }
            if (_topUpAmounts[idx] <= _minBalances[idx]) {
                revert InvalidWatchList();
            }
            s_targets[_subscriptionIds[idx]] = Target({
                isActive: true,
                minBalance: _minBalances[idx],
                topUpAmount: _topUpAmounts[idx],
                lastTopUpTimestamp: 0
            });
        }
        s_watchList = _subscriptionIds;
        emit WatchListUpdated(oldWatchList, _subscriptionIds);
    }

    function getUnderFundedSubscriptions()
        external
        view
        returns (uint64[] memory)
    {
        return _getUnderfundedSubscriptions();
    }

    /**
     * @notice Collects the underfunded subscriptions based on user parameters.
     * @return The subscription IDs that are underfunded.
     */
    function _getUnderfundedSubscriptions()
        internal
        view
        returns (uint64[] memory)
    {
        uint64[] memory watchList = s_watchList;
        uint64[] memory needsFunding = new uint64[](watchList.length);
        uint256 count = 0;
        uint256 minWaitPeriod = minWaitPeriodSeconds;
        Target memory target;
        for (uint256 idx = 0; idx < watchList.length; idx++) {
            target = s_targets[watchList[idx]];
            (uint96 subscriptionBalance, , , ) = COORDINATOR.getSubscription(
                watchList[idx]
            );

            if (
                target.lastTopUpTimestamp + minWaitPeriod <= block.timestamp &&
                subscriptionBalance < target.minBalance
            ) {
                needsFunding[count] = watchList[idx];
                count++;
            }
        }

        return needsFunding;
    }

    function topUp(uint64[] memory needsFunding) external onlyOwner {
        _topUp(needsFunding);
    }

    /**
     * @notice Top up the specified subscriptions if they are underfunded.
     * @param _needsFunding The subscriptions to top up.
     * @dev This function is called by the KeeperRegistry contract.
     * @dev Checks that the subscription is active, has not been topped up recently, and is underfunded.
     */
    function _topUp(uint64[] memory _needsFunding) internal whenNotPaused {
        uint256 _minWaitPeriodSeconds = minWaitPeriodSeconds;
        uint256 contractBalance = ERC677LINK.balanceOf(address(this));
        Target memory target;
        for (uint256 idx = 0; idx < _needsFunding.length; idx++) {
            target = s_targets[_needsFunding[idx]];
            (uint96 subscriptionBalance, , , ) = COORDINATOR.getSubscription(
                _needsFunding[idx]
            );
            if (
                target.isActive &&
                target.lastTopUpTimestamp + _minWaitPeriodSeconds <=
                block.timestamp &&
                subscriptionBalance < target.minBalance &&
                contractBalance >= target.topUpAmount
            ) {
                bool success = ERC677LINK.transferAndCall(
                    address(COORDINATOR),
                    target.topUpAmount,
                    abi.encode(_needsFunding[idx])
                );

                if (success) {
                    s_targets[_needsFunding[idx]].lastTopUpTimestamp = uint56(
                        block.timestamp
                    );
                    emit TopUpSucceeded(_needsFunding[idx]);
                } else {
                    emit TopUpFailed(_needsFunding[idx]);
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
        uint64[] memory needsFunding = _getUnderfundedSubscriptions();
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
            _topUp(needsFunding);
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
    function setERC20Asset(address _assetAddress) public onlyOwner {
        require(_assetAddress != address(0));
        emit ERC20AssetAddressUpdated(address(ERC20ASSET), _assetAddress);
        ERC20ASSET = IERC20(_assetAddress);
    }

    /**
     * @notice Gets an assets balance in the contract.
     * @param _asset The address of the asset.
     * @return uint256 The assets balance in wei.
     **/
    function getAssetBalance(address _asset) public view returns (uint256) {
        return IERC20(_asset).balanceOf(address(this));
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
        needsPegswap = true;
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
     * @dev User should approve dex/pegswap before using contract.
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

    /**
     * @notice Sets the address of the ERC20 LINK token.
     * @param _erc20Link The address of the ERC20 LINK token.
     **/
    function setERC20Link(address _erc20Link) external onlyOwner {
        require(_erc20Link != address(0));
        ERC20LINK = IERC20(_erc20Link);
    }
}
