export const getDEXAddress = async (contract: any): Promise<string> => {
  try {
    return await contract.getDEXRouter();
  } catch (error: any) {
    throw new Error(`Error getting DEX address. Reason: ${error.message}`);
  }
};
