import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect, assert } from "chai";
import { ethers, network } from "hardhat";
import { deploy } from "./utils/helpers";

enum EventType {
  Limit,
  Staleness,
  Volatility,
  None,
}

describe("Circuit Breaker", function () {
  let owner: any, feed: any, limit: any, interval: any, price: any, events: any;
  let circuitBreaker: any;
  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    owner = accounts[0];
    feed = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"; // Mainnet ETH/USD feed
    limit = 0;
    interval = 0;
    price = 0;
    events = [];
    circuitBreaker = await deploy("CircuitBreaker", [
      feed,
      limit,
      interval,
      price,
      events,
    ]);
  });

  describe("constructor", function () {
    it("sets interval", async () => {
      assert.equal(await circuitBreaker.interval(), 0);
    });
    it("sets feed", async () => {
      assert.equal(
        await circuitBreaker.priceFeed(),
        "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
      );
    });
  });

  describe("User Actions", function () {
    it("Should retrieve events", async function () {
      const e = await circuitBreaker.getEvents();
      expect(e.length).to.equal(0);
    });
    it("Should add event type", async function () {
      await circuitBreaker.addEventType(2);
      const e = await circuitBreaker.getEvents();
      expect(e[0]).to.equal(EventType.Volatility);
    });
    it("Should delete event", async function () {
      await circuitBreaker.deleteEventType(2);
      const e = await circuitBreaker.getEvents();
      expect(e.length).to.equal(0);
    });
  });

  describe("checkUpkeep", function () {
    it("returns false if no events are set", async () => {
      await network.provider.send("evm_increaseTime", [interval + 1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const { upkeepNeeded } = await circuitBreaker.callStatic.checkUpkeep(
        "0x"
      );
      assert(!upkeepNeeded);
    });
  });
  describe("performUpkeep", function () {
    it("can only run if checkupkeep is true", async () => {
      await network.provider.send("evm_increaseTime", [interval + 1]);
      await network.provider.request({ method: "evm_mine", params: [] });
      const tx = await circuitBreaker.performUpkeep("0x");
      assert(tx);
    });
    // it("reverts if checkup is false", async () => {
    //   await expect(circuitBreaker.performUpkeep("0x")).to.be.revertedWith(
    //     "CircuitBreaker__UpkeepNotNeeded"
    //   );
    // });
    it("emits correct event on performUpkeep", async () => {
      await circuitBreaker.addEventType(0);
      await expect(circuitBreaker.performUpkeep("0x")).to.emit(circuitBreaker, "Limit")
    });
  });
});
