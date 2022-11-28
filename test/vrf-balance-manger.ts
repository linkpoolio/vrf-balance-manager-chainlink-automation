import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect, assert } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "./utils/helpers";

describe("VRF Balance Manager", function () {
  let owner: any,
    linkTokenAddress: any,
    coordinatorAddress: any,
    keeperRegistryAddress: any,
    minWaitPeriodSeconds: any,
    dexAddress: any,
    linkContractBalance: any,
    erc20AssetAddress: any;
  let vrfBalancer: any;
  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    linkTokenAddress = "0x404460C6A5EdE2D891e8297795264fDe62ADBB75"; // Binance LINK ERC677
    coordinatorAddress = "0x3d2341ADb2D31f1c5530cDC622016af293177AE0"; // Binance VRF Coordinator
    keeperRegistryAddress = "0x02777053d6764996e594c3E88AF1D58D5363a2e6"; // Binance Keeper Registry Mainnet
    minWaitPeriodSeconds = 60;
    dexAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // Pancake swap router
    linkContractBalance = 5;
    erc20AssetAddress = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"; // Binance WETH
    vrfBalancer = await deploy("VRFBalancer", [
      linkTokenAddress,
      coordinatorAddress,
      keeperRegistryAddress,
      minWaitPeriodSeconds,
      dexAddress,
      linkContractBalance,
      erc20AssetAddress,
    ]);
  });

  describe("constructor", function () {
    it("sets Pegswap variable if needed", async () => {
      assert.equal(await vrfBalancer.needsPegswap(), true);
    });
  });
});
