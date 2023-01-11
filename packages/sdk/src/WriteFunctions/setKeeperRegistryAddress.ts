export const setKeeperRegistryAddress = (
    contract: any,
    keeperRegistryAddress: string
  ) => {
    try {
      return contract.setKeeperRegistryAddress(keeperRegistryAddress);
    } catch (error: any) {
      throw new Error(
        `Error setting keeper registry address. Reason: ${error.message}`
      );
    }
  };
