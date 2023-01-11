export const getERC20Asset = async (contract: any): Promise<string> => {
  try {
    return await contract.getERC20Asset();
  } catch (error: any) {
    throw new Error(`Error getting ERC20 asset. Reason: ${error.message}`);
  }
};
