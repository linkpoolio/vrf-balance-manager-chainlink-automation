export const unpause = async (contract: any) => {
  try {
    await contract.unpause();
  } catch (error: any) {
    throw new Error(`Error unpausing. Reason: ${error.message}`);
  }
};
