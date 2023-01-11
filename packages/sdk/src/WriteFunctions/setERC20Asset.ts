export const setERC20Asset = (contract: any, asset: string) => {
  try {
    return contract.setERC20Asset(asset);
  } catch (error: any) {
    throw new Error(`Error setting ERC20 asset. Reason: ${error.message}`);
  }
};
