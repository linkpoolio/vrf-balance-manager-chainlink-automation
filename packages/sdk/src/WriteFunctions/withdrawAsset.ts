export const withdrawAsset = async (
  contract: any,
  address: string,
  payee: string
) => {
  try {
    await contract.withdrawAsset(address, payee);
  } catch (error: any) {
    throw new Error(`Error withdrawing asset. Reason: ${error.message}`);
  }
};
