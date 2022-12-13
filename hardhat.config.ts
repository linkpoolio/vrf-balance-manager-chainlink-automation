import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL as string;
const GOERLI_RPC_URL = process.env.MAINNET_RPC_URL as string;
const BINANCE_RPC_URL = process.env.BINANCE_RPC_URL as string;

const config: HardhatUserConfig = {
  solidity: {
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
    compilers: [
      {
        version: "0.8.17",
      },
      {
        version: "0.6.6",
      },
      {
        version: "0.5.16",
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      gas: 30000000,
      // comment out forking to run tests on a local chain
      forking: {
        url: BINANCE_RPC_URL,
      },
    },
  },
};

export default config;
