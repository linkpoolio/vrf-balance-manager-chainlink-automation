//SPDX-License-Identifier: MIT
pragma solidity <=0.8.17;

import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../contracts/interfaces/PegswapInterface.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract VRFBalancer is Pausable, AutomationCompatibleInterface {
    address public owner;
    address public _tenantOwner;
    uint256 public lastTimeStamp;
    VRFCoordinatorV2Interface public COORDINATOR;
    LinkTokenInterface public LINKTOKEN;
    IERC20 ERC20LINK;
    address public WETH;
    address public keeperRegistryAddress;
    uint256 public minWaitPeriodSeconds;
    uint64[] private s_watchList;
    uint256 private constant MIN_GAS_FOR_TRANSFER = 55_000;
    PegswapInterface pegSwapRouter;

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
        uint256 _minWaitPeriodSeconds
    ) {
        setLinkTokenAddress(_linkTokenAddress);
        setVRFCoordinatorV2Address(_coordinatorAddress);
        setKeeperRegistryAddress(_keeperRegistryAddress);
        setMinWaitPeriodSeconds(_minWaitPeriodSeconds);
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
        uint256 contractBalance = LINKTOKEN.balanceOf(address(this));
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
        uint256 contractBalance = LINKTOKEN.balanceOf(address(this));
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
                bool success = LINKTOKEN.transferAndCall(
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
        emit LinkTokenAddressUpdated(address(LINKTOKEN), linkTokenAddress);
        LINKTOKEN = LinkTokenInterface(linkTokenAddress);
    }

    function setMinWaitPeriodSeconds(uint256 period) public onlyOwner {
        emit MinWaitPeriodUpdated(minWaitPeriodSeconds, period);
        minWaitPeriodSeconds = period;
    }

    function getContractLinkBalance() public view returns (uint256) {
        return LINKTOKEN.balanceOf(address(this));
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
        LINKTOKEN.transfer(payee, amount);
    }

    // TODO: Create Pegswap function if BNB or Polygon
    // Create Dex function to swap token for LINK

    function pegSwap(address _token, uint256 _amount) public onlyOwner {
        require(_token != address(0));
        require(_amount > 0);
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        IERC20(_token).approve(address(pegSwapRouter), _amount);
        pegSwapRouter.swap(_amount, address(ERC20LINK), address(LINKTOKEN));
    }
}
