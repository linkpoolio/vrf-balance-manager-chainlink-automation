import { ethers, network } from "hardhat";
import { networkConfig } from "../network.config";
import { deploy } from "../test/utils/helpers";

async function main() {
  const chainId =
    network.config.chainId != undefined ? network.config.chainId : 31337;

  const networkName = {
    name: networkConfig[chainId],
    keepersUpdateInterval: networkConfig[chainId].keepersUpdateInterval,
    linkTokenERC677: networkConfig[chainId].linkTokenERC677,
    linkTokenERC20: networkConfig[chainId].linkTokenERC20,
    vrfCoordinatorV2: networkConfig[chainId].vrfCoordinatorV2,
    keepersRegistry: networkConfig[chainId].keepersRegistry,
    minWaitPeriodSeconds: networkConfig[chainId].minWaitPeriodSeconds,
    dexAddress: networkConfig[chainId].dexAddress,
    linkContractBalance: networkConfig[chainId].linkContractBalance,
    erc20AssetAddress: networkConfig[chainId].erc20AssetAddress,
    pegswapAddress: networkConfig[chainId].pegswapAddress,
  };

  const bm = await deploy("VRFBalancer", [
    networkName.linkTokenERC677,
    networkName.linkTokenERC20,
    networkName.vrfCoordinatorV2,
    networkName.keepersRegistry,
    networkName.minWaitPeriodSeconds,
    networkName.dexAddress,
    networkName.linkContractBalance,
    networkName.erc20AssetAddress,
  ]);

  await bm.deployed();

  console.log(`VRF Balance Manager deployed to ${bm.address}`);

  if (networkName.pegswapAddress.length > 0) {
    await bm.setPegSwapRouter(networkName.pegswapAddress);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
