import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL as string;
const GOERLI_RPC_URL = process.env.MAINNET_RPC_URL as string;
const BINANCE_MAINNET_RPC_URL = process.env.BINANCE_MAINNET_RPC_URL as string;
const POLYGON_MAINNET_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL as string;
const PRIVATE_KEY = (process.env.PRIVATE_KEY as string) || "0x";

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
      chainId: 31337,
      // comment out forking to run tests on a local chain
      // forking: {
      //   url: BINANCE_RPC_URL,
      // },
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 1,
    },
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 5,
    },
    polygon: {
      url: POLYGON_MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 137,
    },
    binance: {
      url: BINANCE_MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 56,
    },
  },
};

export default config;
