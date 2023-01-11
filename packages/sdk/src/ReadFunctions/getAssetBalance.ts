export const getAssetBalance = async (
  contract: any,
  asset: string
): Promise<number> => {
  try {
    return await contract.getAssetBalance(asset);
  } catch (error: any) {
    throw new Error(`Error getting asset balance. Reason: ${error.message}`);
  }
};
