import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect, assert } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "./utils/helpers";
import { any } from "hardhat/internal/core/params/argumentTypes";

describe("VRF Balance Manager", function () {
  const BASE_FEE = "2500000000";
  const GAS_PRICE_LINK = 1e9;
  let owner: any,
    linkTokenERC20: any,
    linkTokenERC677: any,
    minWaitPeriodSeconds: any,
    linkContractBalance: any,
    erc20WETHMock: any,
    pegswapRouterMock: any,
    vrfCoordinatorV2Mock: any,
    uniswapV2RouterMock: any,
    uniswapV2FactoryMock: any;
  let vrfBalancer: any;
  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    pegswapRouterMock = await deploy("PegSwap");
    vrfCoordinatorV2Mock = await deploy("VRFCoordinatorV2Mock", [
      BASE_FEE,
      GAS_PRICE_LINK,
    ]);
    minWaitPeriodSeconds = 60;
    linkContractBalance = 5;
    erc20WETHMock = await deploy("ERC20Mock", ["Wrapped ETH", "WETH"]);
    linkTokenERC20 = await deploy("ERC20Mock", ["Chainlink", "LINK"]);
    linkTokenERC677 = await deploy("ERC677", [
      "Chainlink",
      "LINK",
      "1000000000000000000000000",
    ]);
    uniswapV2FactoryMock = await deploy("UniswapV2Factory", [owner.address]);
    // UniswapV2Router02 was too large to deploy in hardhat
    uniswapV2RouterMock = await deploy("UniswapV2Router01", [
      uniswapV2FactoryMock.address,
      erc20WETHMock.address,
    ]);
    vrfBalancer = await deploy("VRFBalancer", [
      linkTokenERC677.address,
      vrfCoordinatorV2Mock.address,
      owner.address,
      minWaitPeriodSeconds,
      uniswapV2RouterMock.address,
      linkContractBalance,
      erc20WETHMock.address,
    ]);
  });

  describe("constructor", function () {
    it("sets Pegswap variable if needed", async () => {
      assert.equal(await vrfBalancer.needsPegswap(), false);
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
      const result = await vrfBalancer.setLinkTokenAddress(
        linkTokenERC677.address
      );
      expect(result).to.emit(vrfBalancer, "LinkTokenAddressUpdated");
    });
    it("should revert when address is 0", async () => {
      const linkTokenAddress = "0x0000000000000000000000000000000000000000";
      await expect(vrfBalancer.setLinkTokenAddress(linkTokenAddress)).to.be
        .reverted;
    });
  });

  describe("topUp()", () => {
    it("should run top up coordinator subscriptions", async () => {});
  });

  describe("dexSwap()", () => {
    it("should swap tokens", async () => {
      vrfBalancer.dexSwap();
    });
  });

  describe("pegswap", function () {
    it("gets pegswap router address", async () => {
      await vrfBalancer.setPegSwapRouter(pegswapRouterMock.address);
      assert(
        (await vrfBalancer.getPegSwapRouter()) == pegswapRouterMock.address
      );
    });
  });

  describe("checkUpkeep", function () {
    it("returns false if vrfBalancer is paused", async () => {
      await vrfBalancer.pause();
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      await expect(vrfBalancer.callStatic.checkUpkeep("0x")).to.be.revertedWith(
        "Pausable: paused"
      );
    });
    it("returns false if no vrf subscriptions need funding", async () => {
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const { upkeepNeeded } = await vrfBalancer.callStatic.checkUpkeep("0x");
      assert(!upkeepNeeded);
    });
  });

  describe("performUpkeep", function () {
    it("can only run if checkupkeep is true", async () => {
      await vrfBalancer.setKeeperRegistryAddress(owner.address);
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      // const tx = await vrfBalancer.performUpkeep("0x");
      // assert(tx);
    });
  });
});
