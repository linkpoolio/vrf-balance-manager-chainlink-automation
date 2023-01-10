export const pause = async (contract: any) => {
  try {
    await contract.pause();
  } catch (error: any) {
    throw new Error(`Error pausing. Reason: ${error.message}`);
  }
};
