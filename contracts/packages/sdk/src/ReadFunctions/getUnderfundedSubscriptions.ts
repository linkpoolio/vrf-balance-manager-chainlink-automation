export const getUnderfundSubscriptions = async (
  contract: any
): Promise<number[]> => {
  try {
    return await contract.getUnderfundSubscriptions();
  } catch (error: any) {
    throw new Error(
      `Error getting underfunded subscriptions. Reason: ${error.message}`
    );
  }
};
