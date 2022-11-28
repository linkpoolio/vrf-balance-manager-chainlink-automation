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
    minWaitPeriodSeconds: any;
  let vrfBalancer: any;
  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    linkTokenAddress = "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD"; // Binance LINK ERC20
    coordinatorAddress = "0x3d2341ADb2D31f1c5530cDC622016af293177AE0"; // Binance VRF Coordinator
    keeperRegistryAddress = "0x02777053d6764996e594c3E88AF1D58D5363a2e6"; // Binance Keeper Registry Mainnet
    minWaitPeriodSeconds = 60;
    vrfBalancer = await deploy("VRFBalancer", [
      linkTokenAddress,
      coordinatorAddress,
      keeperRegistryAddress,
      minWaitPeriodSeconds,
    ]);
  });

  describe("constructor", function () {
    it("sets Pegswap variable if needed", async () => {
      assert.equal(await vrfBalancer.needsPegswap(), true);
    });
  });
});
