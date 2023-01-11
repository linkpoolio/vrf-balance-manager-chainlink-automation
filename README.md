# Lotto | Chainlink Automation

## I. About

The VRF Balancer is a configutable smartcontract that allows you to automatically top-up your VRF balance using Chainlink Automation.

## II. Pre-requisites

### 1. Setup Wallet

- Install any wallet to your browser (Metamask, etc.)

### 2. Setup Ganache

- Install ganache client locally
- Run ganache
- Confirm test eth on ganache account
- Set metamask to ganache network

## III. Local Setup

### 1. Clone repo

```
$ git clone git@github.com:linkpoolio/circuit-breaker-chainlink-automation.git
```

### 2. Setup .env file

```
# from /root
$ echo "NETWORK=ganache" >> .env
$ echo "RPC_URL=\"http://127.0.0.1:7545\"" >> .env
```

### 3. Install dependencies.

```
# from /root
$ pnpm install
```

### 4. Deploy contract

```
# from /root
$ make deploy
```

## IV. Run the App

### 1. Run storybook

```
# from /root/ui
$ pnpm storybook
```

### 2. View app

- Open browser at [localhost:9009](localhost:9009)

## V. Testing

### 1. Test Contracts

```bash
# from root
$ make test-contracts
```

### 2. Check test coverage

```bash
# from root
$ make coverage
```

## VI. Deploy

Contract Addresses

Polygon Mainnet

```sol
address ERC20_LINK_ADDRESS = 0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39;
address ERC677_LINK_ADDRESS = 0xb0897686c545045aFc77CF20eC7A532E3120E0F1;
address PEGSWAP_ADDRESS = 0xAA1DC356dc4B18f30C347798FD5379F3D77ABC5b;
address REGISTRAR_ADDRESS = 0x6179B349067af80D0c171f43E6d767E4A00775Cd;
address VRF_COORDINATOR = 0xAE975071Be8F8eE67addBC1A82488F1C24858067
```

Binance Mainnet

```sol
address ERC20_LINK_ADDRESS = 0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD;
address ERC677_LINK_ADDRESS = 0x404460C6A5EdE2D891e8297795264fDe62ADBB75;
address PEGSWAP_ADDRESS = 0x1FCc3B22955e76Ca48bF025f1A6993685975Bb9e;
address VRF_COORDINATOR = 0xc587d9053cd1118f25F645F9E08BB98c9712A4EE
```
