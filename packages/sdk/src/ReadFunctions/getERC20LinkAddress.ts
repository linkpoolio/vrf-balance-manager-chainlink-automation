export const getERC20LinkAddress = async (contract: any): Promise<string> => {
  try {
    return await contract.getERC20LinkAddress();
  } catch (error: any) {
    throw new Error(
      `Error getting ERC20 Link address. Reason: ${error.message}`
    );
  }
};
