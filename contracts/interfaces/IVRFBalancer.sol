//SPDX-License-Identifier: MIT
pragma solidity <=0.8.17;

interface IVRFBalancer {
    function setWatchList(
        uint64[] calldata subscriptionIds,
        uint256[] calldata minBalances,
        uint256[] calldata topUpAmounts
    ) external;

    function addSubscription(uint64 subscriptionId, uint256 minBalance, uint256 topUpAmount) external;
    function deleteSubscription(uint64 subscriptionId) external;
    function updateSubscription(uint64 subscriptionId, uint256 minBalance, uint256 topUpAmount) external;

    function setVRFCoordinatorV2Address(address coordinatorAddress) external;
    function setKeeperRegistryAddress(address keeperAddress) external;
    function setLinkTokenAddresses(address erc677Address, address erc20Address) external;
    function setMaxWatchListSize(uint8 size) external;
    function setMinWaitPeriodSeconds(uint256 period) external;
    function setDEXAddress(address dexAddress) external;
    function setContractLINKMinBalance(uint256 amount) external;
    function setERC20Asset(address assetAddress) external;
    function setPegSwapRouter(address pegSwapAddress) external;
    function setERC20Link(address newAddress) external;

    function getCurrentWatchList() external view returns (uint64[] memory);
    function getERC677Address() external view returns (address);
    function getERC20Address() external view returns (address);
    function getDEXRouter() external view returns (address);
    function getContractLINKMinBalance() external view returns (uint256);
    function getERC20Asset() external view returns (address);
    function getAssetBalance(address asset) external view returns (uint256);
    function getPegSwapRouter() external view returns (address);

    function pause() external;
    function unpause() external;
    function isPaused() external view returns (bool);

    function withdraw(uint256 amount, address payable payee) external;
    function withdrawAsset(address asset) external;
}
