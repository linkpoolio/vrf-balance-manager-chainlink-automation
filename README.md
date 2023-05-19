# VRF Balance Manager | Chainlink Automation

## I. About

The VRF Balancer is a configutable smartcontract that allows you to automatically top-up your VRF balance using Chainlink Automation.

## II. Pre-requisites

### 1. Setup Wallet

- Install any wallet to your browser (Metamask, etc.)

## III. Local Setup

### 1. Clone repo

```
git clone git@github.com:linkpoolio/vrf-balance-chainlink-automation.git
```

### 2. Setup .env file

```
# from /root
echo "NETWORK=hardhat" >> .env
echo "RPC_URL=\"http://127.0.0.1:7545\"" >> .env
```

### 3. Install dependencies.

```
# from /root
npm install
```

### 4. Deploy contract

```
# from /root
make deploy
```

## IV. Run the App

### 1. Run storybook

```
# from /root/ui
npm storybook
```

### 2. View app

- Open browser at [localhost:9009](localhost:9009)

## V. Testing

### 1. Test Contracts

```bash
# from root
make test-contracts
```

### 2. Check test coverage

```bash
# from root
make coverage
```

## VI. Deploy

```bash
make deploy
```

Example Constructor Arguments (See `network.config.ts` for more networks)

```json
    name: "binance-mainnet",
    linkTokenERC677: "0x404460C6A5EdE2D891e8297795264fDe62ADBB75",
    linkTokenERC20: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD",
    vrfCoordinatorV2: "0xc587d9053cd1118f25F645F9E08BB98c9712A4EE",
    keepersRegistry: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    minWaitPeriodSeconds: 86400, // 1 day
    dexAddress: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap Router
    erc20AssetAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
    pegswapAddress: "0x1FCc3B22955e76Ca48bF025f1A6993685975Bb9e",
```
