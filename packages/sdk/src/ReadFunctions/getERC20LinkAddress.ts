export const getERC20LinkAddress = async (contract: any): Promise<string> => {
  try {
    return await contract.getERC20Address();
  } catch (error: any) {
    throw new Error(
      `Error getting ERC20 Link address. Reason: ${error.message}`
    );
  }
};
