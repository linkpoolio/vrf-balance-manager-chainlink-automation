export const getERC677LinkAddress = async (contract: any): Promise<string> => {
  try {
    return await contract.getERC677Address();
  } catch (error: any) {
    throw new Error(`Error getting ERC677 address. Reason: ${error.message}`);
  }
};
