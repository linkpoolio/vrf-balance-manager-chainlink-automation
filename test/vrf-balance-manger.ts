import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect, assert } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "./utils/helpers";
import { any } from "hardhat/internal/core/params/argumentTypes";

describe("VRF Balance Manager", function () {
  let owner: any,
    linkTokenAddress: any,
    coordinatorAddress: any,
    keeperRegistryAddress: any,
    minWaitPeriodSeconds: any,
    dexAddress: any,
    linkContractBalance: any,
    erc20AssetAddress: any,
    pegswapRouterAddress: any,
    mockKeeper: any;
  let vrfBalancer: any;
  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    mockKeeper = accounts[1];
    linkTokenAddress = "0x404460C6A5EdE2D891e8297795264fDe62ADBB75"; // Binance LINK ERC677
    coordinatorAddress = "0xc587d9053cd1118f25F645F9E08BB98c9712A4EE"; // Binance VRF Coordinator
    keeperRegistryAddress = "0x02777053d6764996e594c3E88AF1D58D5363a2e6"; // Binance Keeper Registry Mainnet
    minWaitPeriodSeconds = 60;
    dexAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // Pancake swap router
    linkContractBalance = 5;
    erc20AssetAddress = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c"; // Binance WETH
    pegswapRouterAddress = "0x1FCc3B22955e76Ca48bF025f1A6993685975Bb9e"; // Pegswap router Binance
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

  describe("pause logic", function () {
    it("can pause contract", async () => {
      await vrfBalancer.pause();
      assert.equal(await vrfBalancer.isPaused(), true);
    });
    it("can un-pause contract", async () => {
      await vrfBalancer.pause();
      await vrfBalancer.unpause();
      assert.equal(await vrfBalancer.isPaused(), false);
    });
  });

  describe("setLinkTokenAddress()", () => {
    it("should emit LinkTokenAddressUpdated event when address is set successfully", async () => {
      const result = await vrfBalancer.setLinkTokenAddress(linkTokenAddress);
      expect(result).to.emit(vrfBalancer, "LinkTokenAddressUpdated");
    });
    it("should revert when address is 0", async () => {
      const linkTokenAddress = "0x0000000000000000000000000000000000000000";
      await expect(vrfBalancer.setLinkTokenAddress(linkTokenAddress)).to.be
        .reverted;
    });
  });

  describe("topUp()", () => {});

  describe("dexSwap()", () => {});

  describe("pegswap", function () {
    it("gets pegswap router address", async () => {
      await vrfBalancer.setPegSwapRouter(pegswapRouterAddress);
      assert.equal(await vrfBalancer.getPegSwapRouter(), pegswapRouterAddress);
    });
  });

  describe("checkUpkeep", function () {
    it("returns false if vrfBalancer is not live", async () => {
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const { upkeepNeeded } = await vrfBalancer.callStatic.checkUpkeep("0x");
      assert(!upkeepNeeded);
    });
  });

  describe("performUpkeep", function () {
    it("can only run if checkupkeep is true", async () => {
      await vrfBalancer.setKeeperRegistryAddress(owner);
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const tx = await vrfBalancer.performUpkeep("0x");
      assert(tx);
    });
    // it("reverts if checkup is false", async () => {
    //   await expect(lotto.performUpkeep("0x")).to.be.revertedWith(
    //     "Lotto__UpkeepNotNeeded"
    //   );
    // });
  });
});
