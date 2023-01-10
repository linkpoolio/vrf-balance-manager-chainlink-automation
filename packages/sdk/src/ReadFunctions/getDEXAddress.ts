export const getDEXAddress = async (contract: any): Promise<string> => {
  try {
    return await contract.getDEXAddress();
  } catch (error: any) {
    throw new Error(`Error getting DEX address. Reason: ${error.message}`);
  }
};
