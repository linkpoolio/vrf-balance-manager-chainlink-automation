
-include .env

deploy:
	npx hardhat run --network ${NETWORK} scripts/deploy.ts

test-contracts: 
	npx hardhat test --show-stack-traces

coverage:
	npx hardhat coverage