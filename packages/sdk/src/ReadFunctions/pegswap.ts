export const getPegSwapRouter = async (contract: any): Promise<string> => {
  try {
    return await contract.getPegSwapRouter();
  } catch (error: any) {
    throw new Error(`Error getting peg swap router. Reason: ${error.message}`);
  }
};
