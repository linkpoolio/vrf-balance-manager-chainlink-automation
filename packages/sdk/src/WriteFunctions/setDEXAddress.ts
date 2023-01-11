export const setDEXAddress = (contract: any, dexAddress: string) => {
  try {
    return contract.setDEXAddress(dexAddress);
  } catch (error: any) {
    throw new Error(`Error setting dex address. Reason: ${error.message}`);
  }
};
