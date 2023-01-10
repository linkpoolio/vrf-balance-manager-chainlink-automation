export const getMinWaitPeriodSeconds = async (
  contract: any
): Promise<number> => {
  try {
    return await contract.getMinWaitPeriodSeconds();
  } catch (error: any) {
    throw new Error(
      `Error getting min wait period seconds. Reason: ${error.message}`
    );
  }
};
