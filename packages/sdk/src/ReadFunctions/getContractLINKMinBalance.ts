export const getContractLINKMinBalance = async (
  contract: any
): Promise<number> => {
  try {
    return await contract.getContractLINKMinBalance();
  } catch (error: any) {
    throw new Error(
      `Error getting contract LINK min balance. Reason: ${error.message}`
    );
  }
};
