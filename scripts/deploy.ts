import { ethers } from "hardhat";

async function main() {
  const BM = await ethers.getContractFactory("VRFBalanceManger");
  const bm = await BM.deploy();

  await bm.deployed();

  console.log(`Circuit Breaker deployed to ${bm.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
