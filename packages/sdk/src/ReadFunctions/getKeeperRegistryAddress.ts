export const getKeeperRegistryAddress = async (
  contract: any
): Promise<string> => {
  try {
    return await contract.getKeeperRegistryAddress();
  } catch (error: any) {
    throw new Error(
      `Error getting keeper registry address. Reason: ${error.message}`
    );
  }
};
