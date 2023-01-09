import { ethers } from "hardhat";

export const networkConfig: { [key: number]: any } = {
  1: {
    name: "mainnet",
    linkTokenERC677: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    linkTokenERC20: "0x0000000000000000000000000000000000000000",
    vrfCoordinatorV2: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
    keepersRegistry: "	0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    minWaitPeriodSeconds: 86400, // 1 day
    dexAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // UniswapV2 Router02
    linkContractBalance: ethers.utils.parseEther("5"),
    erc20AssetAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // wETH
  },
  5: {
    name: "goerli",
    linkTokenERC677: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    linkTokenERC20: "0x0000000000000000000000000000000000000000",
    vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    keepersRegistry: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    minWaitPeriodSeconds: 86400, // 1 day
    dexAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // UniswapV2 Router02
    linkContractBalance: ethers.utils.parseEther("5"),
    erc20AssetAddress: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
  },
  56: {
    name: "binance-mainnet",
    linkTokenERC677: "0x404460C6A5EdE2D891e8297795264fDe62ADBB75",
    linkTokenERC20: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD",
    vrfCoordinatorV2: "0xc587d9053cd1118f25F645F9E08BB98c9712A4EE",
    keepersRegistry: "	0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    minWaitPeriodSeconds: 86400, // 1 day
    dexAddress: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap Router
    linkContractBalance: ethers.utils.parseEther("5"),
    erc20AssetAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
  },
  137: {
    name: "polygon-mainnet",
    linkTokenERC677: "0xb0897686c545045aFc77CF20eC7A532E3120E0F1",
    linkTokenERC20: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
    vrfCoordinatorV2: "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
    keepersRegistry: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    minWaitPeriodSeconds: 86400, // 1 day
    dexAddress: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // QuickSwap Router
    linkContractBalance: ethers.utils.parseEther("5"),
    erc20AssetAddress: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
  },
  7777: {
    name: "ganache",
    linkTokenERC677: "0xb0897686c545045aFc77CF20eC7A532E3120E0F1",
    linkTokenERC20: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
    vrfCoordinatorV2: "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
    keepersRegistry: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    minWaitPeriodSeconds: 86400,
    dexAddress: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
    linkContractBalance: ethers.utils.parseEther("5"),
    erc20AssetAddress: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  },
};
