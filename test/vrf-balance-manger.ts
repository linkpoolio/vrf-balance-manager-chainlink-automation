import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect, assert } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "./utils/helpers";
import { any } from "hardhat/internal/core/params/argumentTypes";

describe("VRF Balance Manager", function () {
  const BASE_FEE = "2500000000";
  const GAS_PRICE_LINK = 1e9;
  const minWaitPeriodSeconds = 60;
  const linkContractBalance = ethers.utils.parseEther("5");
  let owner: any,
    linkTokenERC20: any,
    linkTokenERC677: any,
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
    erc20WETHMock = await deploy("ERC20Mock", ["Wrapped ETH", "WETH"]);
    linkTokenERC20 = await deploy("ERC20Mock", ["Chainlink", "LINK"]);
    linkTokenERC677 = await deploy("ERC677", [
      "Chainlink",
      "LINK",
      "1000000000000000000000000",
    ]);
    await linkTokenERC20.approve(
      pegswapRouterMock.address,
      ethers.utils.parseEther("100000")
    );
    await linkTokenERC677.approve(
      pegswapRouterMock.address,
      ethers.utils.parseEther("100000")
    );
    //pegswap setup
    await pegswapRouterMock.addLiquidity(
      ethers.utils.parseEther("100"),
      linkTokenERC677.address,
      linkTokenERC20.address
    ); //add liquidity erc20 LINK
    await pegswapRouterMock.addLiquidity(
      ethers.utils.parseEther("100"),
      linkTokenERC20.address,
      linkTokenERC677.address
    ); //add liquidity erc677 LINK

    //uniswap setup
    uniswapV2FactoryMock = await deploy("UniswapV2Factory", [owner.address]);
    await uniswapV2FactoryMock.createPair(
      erc20WETHMock.address,
      linkTokenERC20.address
    );
    const pair = await uniswapV2FactoryMock.getPair(
      erc20WETHMock.address,
      linkTokenERC20.address
    );
    // UniswapV2Router02 was too large to deploy in hardhat
    uniswapV2RouterMock = await deploy("UniswapV2Router01", [
      uniswapV2FactoryMock.address,
      erc20WETHMock.address,
    ]);
    await erc20WETHMock.approve(
      uniswapV2RouterMock.address,
      ethers.utils.parseEther("2000")
    );
    await linkTokenERC20.approve(
      uniswapV2RouterMock.address,
      ethers.utils.parseEther("2000")
    );
    await linkTokenERC677.approve(
      uniswapV2RouterMock.address,
      ethers.utils.parseEther("2000")
    );
    await uniswapV2RouterMock.addLiquidity(
      erc20WETHMock.address,
      linkTokenERC20.address,
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("100"),
      0,
      0,
      owner.address,
      Date.now() + 1000
    );

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

  // describe("constructor", function () {
  //   it("sets Pegswap variable if needed", async () => {
  //     assert.equal(await vrfBalancer.needsPegswap(), false);
  //   });
  // });

  // describe("pause logic", function () {
  //   it("can pause contract", async () => {
  //     await vrfBalancer.pause();
  //     assert.equal(await vrfBalancer.isPaused(), true);
  //   });
  //   it("can un-pause contract", async () => {
  //     await vrfBalancer.pause();
  //     await vrfBalancer.unpause();
  //     assert.equal(await vrfBalancer.isPaused(), false);
  //   });
  // });

  // describe("setLinkTokenAddress()", () => {
  //   it("should emit LinkTokenAddressUpdated event when address is set successfully", async () => {
  //     const result = await vrfBalancer.setLinkTokenAddress(
  //       linkTokenERC677.address
  //     );
  //     expect(result).to.emit(vrfBalancer, "LinkTokenAddressUpdated");
  //   });
  //   it("should revert when address is 0", async () => {
  //     const linkTokenAddress = "0x0000000000000000000000000000000000000000";
  //     await expect(vrfBalancer.setLinkTokenAddress(linkTokenAddress)).to.be
  //       .reverted;
  //   });
  // });

  // describe("topUp()", () => {
  //   it("should run top up coordinator subscriptions", async () => {});
  // });

  describe("dexSwap()", () => {
    it("should swap erc20 tokens", async () => {
      await erc20WETHMock.transfer(
        vrfBalancer.address,
        ethers.utils.parseEther("5")
      );
      await vrfBalancer.approveAmount(
        erc20WETHMock.address,
        uniswapV2RouterMock.address,
        ethers.utils.parseEther("100")
      );
      expect(
        await vrfBalancer.dexSwap(
          erc20WETHMock.address,
          linkTokenERC20.address,
          ethers.utils.parseEther("1")
        )
      ).to.emit(vrfBalancer, "DexSwapSuccess");
    });
    it("should swap erc677 tokens", async () => {
      await erc20WETHMock.transfer(
        vrfBalancer.address,
        ethers.utils.parseEther("5")
      );
      await vrfBalancer.approveAmount(
        erc20WETHMock.address,
        uniswapV2RouterMock.address,
        ethers.utils.parseEther("100")
      );
      expect(
        await vrfBalancer.dexSwap(
          erc20WETHMock.address,
          linkTokenERC677.address,
          ethers.utils.parseEther("1")
        )
      ).to.emit(vrfBalancer, "DexSwapSuccess");
    });
  });

  // describe("pegswap", function () {
  //   it("gets pegswap router address", async () => {
  //     await vrfBalancer.setPegSwapRouter(pegswapRouterMock.address);
  //     assert(
  //       (await vrfBalancer.getPegSwapRouter()) == pegswapRouterMock.address
  //     );
  //   });
  //   it("swap erc20 to erc677 LINK", async () => {
  //     await vrfBalancer.setPegSwapRouter(pegswapRouterMock.address);
  //     await vrfBalancer.setERC20Link(linkTokenERC20.address);
  //     await linkTokenERC20.transfer(
  //       vrfBalancer.address,
  //       ethers.utils.parseEther("1")
  //     );
  //     await vrfBalancer.approveAmount(
  //       linkTokenERC20.address,
  //       pegswapRouterMock.address,
  //       ethers.utils.parseEther("100")
  //     );
  //     await vrfBalancer.pegSwap();
  //     const amount = await linkTokenERC677.balanceOf(vrfBalancer.address);
  //     assert(ethers.utils.formatEther(amount) == "1.0");
  //   });
  // });

  // describe("DEX integration", () => {
  //   it("should swap tokens", async () => {
  //     await erc20WETHMock.transfer(
  //       vrfBalancer.address,
  //       ethers.utils.parseEther("5")
  //     );
  //     await vrfBalancer.approveAmount(
  //       erc20WETHMock.address,
  //       uniswapV2RouterMock.address,
  //       ethers.utils.parseEther("100")
  //     );
  //     expect(
  //       await vrfBalancer.dexSwap(
  //         erc20WETHMock.address,
  //         linkTokenERC20.address,
  //         ethers.utils.parseEther("1")
  //       )
  //     ).to.emit(vrfBalancer, "DexSwapSuccess");
  //     await vrfBalancer.setPegSwapRouter(pegswapRouterMock.address);
  //     await vrfBalancer.setERC20Link(linkTokenERC20.address);
  //     await vrfBalancer.approveAmount(
  //       linkTokenERC20.address,
  //       pegswapRouterMock.address,
  //       ethers.utils.parseEther("100")
  //     );
  //     await vrfBalancer.pegSwap();
  //     const amount = await vrfBalancer.getAssetBalance(linkTokenERC677.address);
  //     assert(ethers.utils.formatEther(amount) == "0.987158034397061298");
  //   });
  // });

  // describe("set VRF subscription watcher", function () {
  //   it("sets subId to watch", async () => {
  //     const tx = await vrfCoordinatorV2Mock.createSubscription();
  //     const txReceipt = await tx.wait(1);
  //     const subscriptionId = txReceipt.events[0].args.subId;
  //     await expect(
  //       vrfBalancer.setWatchList(
  //         [subscriptionId],
  //         [ethers.utils.parseEther("1")],
  //         [ethers.utils.parseEther("2")]
  //       )
  //     ).to.emit(vrfBalancer, "WatchListUpdated");
  //   });
  //   it("fails if odd array arguments", async () => {
  //     const tx = await vrfCoordinatorV2Mock.createSubscription();
  //     const txReceipt = await tx.wait(1);
  //     const subscriptionId = txReceipt.events[0].args.subId;
  //     await expect(
  //       vrfBalancer.setWatchList(
  //         [subscriptionId],
  //         [ethers.utils.parseEther("1")],
  //         []
  //       )
  //     ).to.be.revertedWithCustomError(vrfBalancer, "InvalidWatchList");
  //   });
  //   it("fails if top up amount <= min balance trigger", async () => {
  //     const tx = await vrfCoordinatorV2Mock.createSubscription();
  //     const txReceipt = await tx.wait(1);
  //     const subscriptionId = txReceipt.events[0].args.subId;
  //     await expect(
  //       vrfBalancer.setWatchList(
  //         [subscriptionId],
  //         [ethers.utils.parseEther("1")],
  //         [ethers.utils.parseEther("1")]
  //       )
  //     ).to.be.revertedWithCustomError(vrfBalancer, "InvalidWatchList");
  //   });
  // });

  describe("check VRF subscription funds", function () {
    it("returns a under funded subscription", async () => {
      const tx = await vrfCoordinatorV2Mock.createSubscription();
      const txReceipt = await tx.wait(1);
      const subscriptionId = txReceipt.events[0].args.subId;
      await vrfBalancer.setWatchList(
        [subscriptionId],
        [ethers.utils.parseEther("5")],
        [ethers.utils.parseEther("6")]
      );
      await vrfCoordinatorV2Mock.fundSubscription(
        subscriptionId.toNumber(),
        ethers.utils.parseEther("1")
      );
      const needed = await vrfBalancer.getUnderFundedSubscriptions();
      assert(needed.length == 1);
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
    it("returns true if a vrf subscription is under funded", async () => {
      const tx = await vrfCoordinatorV2Mock.createSubscription();
      const txReceipt = await tx.wait(1);
      const subscriptionId = txReceipt.events[0].args.subId;
      await vrfBalancer.setWatchList(
        [subscriptionId],
        [ethers.utils.parseEther("5")],
        [ethers.utils.parseEther("6")]
      );
      await vrfCoordinatorV2Mock.fundSubscription(
        subscriptionId.toNumber(),
        ethers.utils.parseEther("1")
      );
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const { upkeepNeeded } = await vrfBalancer.callStatic.checkUpkeep("0x");
      assert(upkeepNeeded);
    });
  });

  describe("performUpkeep", function () {
    it("can only run if checkupkeep is true", async () => {
      await vrfBalancer.setKeeperRegistryAddress(owner.address);
      const tx = await vrfCoordinatorV2Mock.createSubscription();
      const txReceipt = await tx.wait(1);
      const subscriptionId = txReceipt.events[0].args.subId;
      await vrfBalancer.setWatchList(
        [subscriptionId],
        [ethers.utils.parseEther("5")],
        [ethers.utils.parseEther("6")]
      );
      await vrfCoordinatorV2Mock.fundSubscription(
        subscriptionId.toNumber(),
        ethers.utils.parseEther("1")
      );
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const { upkeepNeeded, performData } =
        await vrfBalancer.callStatic.checkUpkeep("0x");

      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      await erc20WETHMock.transfer(
        vrfBalancer.address,
        ethers.utils.parseEther("10")
      );
      await vrfBalancer.approveAmount(
        erc20WETHMock.address,
        uniswapV2RouterMock.address,
        ethers.utils.parseEther("10")
      );
      await uniswapV2RouterMock.addLiquidity(
        erc20WETHMock.address,
        linkTokenERC677.address,
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
        0,
        0,
        owner.address,
        Date.now() + 1000
      );
      await vrfBalancer.performUpkeep(performData);
    });
  });
});
