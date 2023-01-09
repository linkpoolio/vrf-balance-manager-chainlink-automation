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
