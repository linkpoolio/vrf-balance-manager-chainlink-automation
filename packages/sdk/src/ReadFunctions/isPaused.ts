export const isPaused = async (contract: any): Promise<boolean> => {
  try {
    return await contract.isPaused();
  } catch (error: any) {
    throw new Error(`Error checking if paused. Reason: ${error.message}`);
  }
};
