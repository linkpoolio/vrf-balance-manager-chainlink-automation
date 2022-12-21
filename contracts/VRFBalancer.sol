//SPDX-License-Identifier: MIT
pragma solidity <=0.8.17;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../contracts/interfaces/PegswapInterface.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

/**
 * @title VRFBalancer
 * @notice Creates automation for vrf subscriptions
 * @dev The _linkTokenAddress in constructor is the ERC677 LINK token address of the network
 */
contract VRFBalancer is Pausable, AutomationCompatibleInterface {
    VRFCoordinatorV2Interface public COORDINATOR;
    LinkTokenInterface public erc677Link;
    IERC20 erc20Link;
    IERC20 erc20Asset;
    PegswapInterface pegSwapRouter;
    IUniswapV2Router02 dexRouter;
    address public owner;
    address public keeperRegistryAddress;
    uint256 public minWaitPeriodSeconds;
    uint256 contractLINKMinBalance;
    uint64[] private watchList;
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
    event DEXAddressUpdated(address newDEXAddress);
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
        address linkTokenAddress,
        address coordinatorAddress,
        address keeperAddress,
        uint256 minPeriodSeconds,
        address dexContractAddress,
        uint256 linkContractBalance,
        address erc20AssetAddress
    ) {
        owner = msg.sender;
        setLinkTokenAddress(linkTokenAddress);
        setVRFCoordinatorV2Address(coordinatorAddress);
        setKeeperRegistryAddress(keeperAddress);
        setMinWaitPeriodSeconds(minPeriodSeconds);
        setDEXAddress(dexContractAddress);
        setContractLINKMinBalance(linkContractBalance);
        setERC20Asset(erc20AssetAddress);
    }

    /**
     * @notice Sets the VRF subscriptions to watch for, along with min balnces and topup amounts.
     * @param subscriptionIds The subscription IDs to watch.
     * @param minBalances The minimum balances to maintain for each subscription.
     * @param topUpAmounts The amount to top up each subscription by when it falls below the minimum.
     * @dev The arrays must be the same length.
     */
    function setWatchList(
        uint64[] calldata subscriptionIds,
        uint256[] calldata minBalances,
        uint256[] calldata topUpAmounts
    ) external onlyOwner {
        if (
            subscriptionIds.length != minBalances.length ||
            subscriptionIds.length != topUpAmounts.length
        ) {
            revert InvalidWatchList();
        }
        uint64[] memory oldWatchList = watchList;
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
            if (topUpAmounts[idx] == 0) {
                revert InvalidWatchList();
            }
            if (topUpAmounts[idx] <= minBalances[idx]) {
                revert InvalidWatchList();
            }
            s_targets[subscriptionIds[idx]] = Target({
                isActive: true,
                minBalance: minBalances[idx],
                topUpAmount: topUpAmounts[idx],
                lastTopUpTimestamp: 0
            });
        }
        watchList = subscriptionIds;
        emit WatchListUpdated(oldWatchList, subscriptionIds);
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
        uint64[] memory currentWatchList = watchList;
        uint64[] memory needsFunding = new uint64[](currentWatchList.length);
        uint256 count = 0;
        uint256 minWaitPeriod = minWaitPeriodSeconds;
        Target memory target;
        for (uint256 idx = 0; idx < currentWatchList.length; idx++) {
            target = s_targets[currentWatchList[idx]];
            (uint96 subscriptionBalance, , , ) = COORDINATOR.getSubscription(
                currentWatchList[idx]
            );

            if (
                target.lastTopUpTimestamp + minWaitPeriod <= block.timestamp &&
                subscriptionBalance < target.minBalance
            ) {
                needsFunding[count] = currentWatchList[idx];
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
     * @param needsFunding The subscriptions to top up.
     * @dev This function is called by the KeeperRegistry contract.
     * @dev Checks that the subscription is active, has not been topped up recently, and is underfunded.
     */
    function _topUp(uint64[] memory needsFunding) internal whenNotPaused {
        uint256 _minWaitPeriodSeconds = minWaitPeriodSeconds;
        uint256 contractBalance = erc677Link.balanceOf(address(this));
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
                subscriptionBalance < target.minBalance &&
                contractBalance >= target.topUpAmount
            ) {
                bool success = erc677Link.transferAndCall(
                    address(COORDINATOR),
                    target.topUpAmount,
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
                    address(erc20Asset),
                    address(erc20Link),
                    erc20Asset.balanceOf(address(this))
                );
                _pegSwap();
            } else {
                _dexSwap(
                    address(erc20Asset),
                    address(erc677Link),
                    erc20Asset.balanceOf(address(this))
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
     * @param keeperAddress The address of the keeper registry.
     */
    function setKeeperRegistryAddress(address keeperAddress) public onlyOwner {
        require(keeperAddress != address(0));
        emit KeeperRegistryAddressUpdated(keeperRegistryAddress, keeperAddress);
        keeperRegistryAddress = keeperAddress;
    }

    /**
     * @notice Sets the LINK token address.
     * @param linkTokenAddress The address of the LINK token.
     */
    function setLinkTokenAddress(address linkTokenAddress) public onlyOwner {
        require(linkTokenAddress != address(0));
        if (
            linkTokenAddress == BNB_LINK_ERC677 ||
            linkTokenAddress == POLYGON_LINK_ERC677
        ) {
            needsPegswap = true;
            if (linkTokenAddress == BNB_LINK_ERC677) {
                erc20Link = IERC20(BNB_LINK_ERC20);
            } else {
                erc20Link = IERC20(POLYGON_LINK_ERC20);
            }

            erc677Link = LinkTokenInterface(linkTokenAddress);
            emit LinkTokenAddressUpdated(address(erc20Link), linkTokenAddress);
        } else {
            emit LinkTokenAddressUpdated(address(erc677Link), linkTokenAddress);
            erc677Link = LinkTokenInterface(linkTokenAddress);
        }
    }

    /**
     * @notice Sets the minimum wait period between top up checks.
     * @param period The minimum wait period in seconds.
     */
    function setMinWaitPeriodSeconds(uint256 period) public onlyOwner {
        emit MinWaitPeriodUpdated(minWaitPeriodSeconds, period);
        minWaitPeriodSeconds = period;
    }

    /**
     * @notice Sets the decentralized exchange address.
     * @param dexAddress The address of the decentralized exchange.
     * @dev The decentralized exchange must support the uniswap v2 router interface.
     */
    function setDEXAddress(address dexAddress) public onlyOwner {
        require(dexAddress != address(0));
        emit DEXAddressUpdated(dexAddress);
        dexRouter = IUniswapV2Router02(dexAddress);
    }

    /**
     * @notice Sets the minimum LINK balance the contract should have.
     * @param amount The minimum LINK balance in wei.
     */
    function setContractLINKMinBalance(uint256 amount) public onlyOwner {
        require(amount > 0);
        emit ContractLINKMinBalanceUpdated(contractLINKMinBalance, amount);
        contractLINKMinBalance = amount;
    }

    /**
     * @notice Sets the address of the ERC20 asset being traded.
     * @param assetAddress The address of the ERC20 asset.
     **/
    function setERC20Asset(address assetAddress) public onlyOwner {
        require(assetAddress != address(0));
        emit ERC20AssetAddressUpdated(address(erc20Asset), assetAddress);
        erc20Asset = IERC20(assetAddress);
    }

    /**
     * @notice Gets an assets balance in the contract.
     * @param asset The address of the asset.
     * @return uint256 The assets balance in wei.
     **/
    function getAssetBalance(address asset) public view returns (uint256) {
        return IERC20(asset).balanceOf(address(this));
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
        bool ok = erc677Link.transfer(payee, amount);
        require(ok, "LINK transfer failed");
    }

    function dexSwap(
        address fromToken,
        address toToken,
        uint256 amount
    ) public onlyOwner {
        _dexSwap(fromToken, toToken, amount);
    }

    /**
     * @notice Uses the Uniswap Clone contract router to swap ERC20 for ERC20/ERC677 LINK.
     * @param fromToken Token address sending to swap.
     * @param toToken Token address receiving from swap.
     * @param amount Total tokens sending to swap.
     */
    function _dexSwap(
        address fromToken,
        address toToken,
        uint256 amount
    ) internal whenNotPaused {
        address[] memory path = new address[](2);
        path[0] = fromToken;
        path[1] = toToken;
        uint256[] memory amounts = dexRouter.swapExactTokensForTokens(
            amount,
            1,
            path,
            address(this),
            block.timestamp
        );
        emit DexSwapSuccess(amounts[1], fromToken, toToken);
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
            erc20Link.balanceOf(address(this)),
            address(erc20Link),
            address(erc677Link)
        );
        emit PegSwapSuccess(
            erc677Link.balanceOf(address(this)),
            address(erc20Link),
            address(erc677Link)
        );
    }

    /**
     * @notice Sets PegSwap router address.
     * @param pegSwapAddress The address of the PegSwap router.
     */
    function setPegSwapRouter(address pegSwapAddress) external onlyOwner {
        require(pegSwapAddress != address(0));
        emit PegswapRouterUpdated(address(pegSwapRouter), pegSwapAddress);
        pegSwapRouter = PegswapInterface(pegSwapAddress);
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
     * @param token The address of the ERC20 asset.
     * @param to The address of the dex router.
     * @param amount The amount to approve.
     * @dev User should approve dex/pegswap before using contract.
     */
    function approveAmount(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        bool ok = IERC20(token).approve(to, amount);
        require(ok, "ERC20: approve failed");
    }

    /**
     * @notice Checks allowance of dex for ERC20 asset.
     * @param asset The address of the ERC20 asset.
     * @param router The address of the dex router.
     * @return uint256 The allowance amount.
     */
    function getAllowanceAmount(address asset, address router)
        external
        view
        returns (uint256)
    {
        return IERC20(asset).allowance(address(this), address(router));
    }

    /**
     * @notice Sets the address of the ERC20 LINK token.
     * @param newAddress The address of the ERC20 LINK token.
     **/
    function setERC20Link(address newAddress) external onlyOwner {
        require(newAddress != address(0));
        erc20Link = IERC20(newAddress);
    }

    /**
     * @notice Withdraw token assets.
     * @param asset The address of the token to withdraw.
     **/
    function withdrawAsset(address asset) external onlyOwner {
        uint256 balance = IERC20(asset).balanceOf(address(this));
        require(balance > 0, "Nothing to withdraw");
        bool ok = IERC20(asset).transfer(msg.sender, balance);
        require(ok, "token transfer failed");
    }
}
