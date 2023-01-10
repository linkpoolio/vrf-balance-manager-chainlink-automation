export const setKeeperRegistryAddress = (
  contract: any,
  keeperRegistryAddress: string
) => {
  try {
    return contract.setKeeperRegistryAddress(keeperRegistryAddress);
  } catch (error: any) {
    throw new Error(
      `Error setting keeper registry address. Reason: ${error.message}`
    );
  }
};

export const setLinkTokenAddresses = (
  contract: any,
  erc677Address: string,
  erc20Address: string
) => {
  try {
    return contract.setLinkTokenAddresses(erc677Address, erc20Address);
  } catch (error: any) {
    throw new Error(
      `Error setting link token addresses. Reason: ${error.message}`
    );
  }
};

export const parsePeriod = (period: string): Number => {
  try {
    return Number(period);
  } catch (error: any) {
    throw new Error(`Error parsing period. Reason: ${error.message}`);
  }
};

export const setMinWaitPeriodSeconds = (contract: any, period: string) => {
  try {
    const parsedPeriod = parsePeriod(period);
    return contract.setMinWaitPeriodSeconds(parsedPeriod);
  } catch (error: any) {
    throw new Error(
      `Error setting min wait period seconds. Reason: ${error.message}`
    );
  }
};

export const setDEXAddress = (contract: any, dexAddress: string) => {
  try {
    return contract.setDEXAddress(dexAddress);
  } catch (error: any) {
    throw new Error(`Error setting dex address. Reason: ${error.message}`);
  }
};

export const parseAmount = (amount: string): Number => {
  try {
    return Number(amount);
  } catch (error: any) {
    throw new Error(`Error parsing amount. Reason: ${error.message}`);
  }
};

export const setContractLINKMinBalance = (contract: any, amount: string) => {
  try {
    const parsedAmount = parseAmount(amount);
    return contract.setContractLINKMinBalance(parsedAmount);
  } catch (error: any) {
    throw new Error(
      `Error setting contract LINK min balance. Reason: ${error.message}`
    );
  }
};

export const setERC20Asset = (contract: any, asset: string) => {
  try {
    return contract.setERC20Asset(asset);
  } catch (error: any) {
    throw new Error(`Error setting ERC20 asset. Reason: ${error.message}`);
  }
};


