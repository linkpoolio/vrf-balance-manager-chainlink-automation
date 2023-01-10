export const withdrawAsset = async (contract: any, address: string) => {
  try {
    await contract.withdrawAsset(address);
  } catch (error: any) {
    throw new Error(`Error withdrawing asset. Reason: ${error.message}`);
  }
};
