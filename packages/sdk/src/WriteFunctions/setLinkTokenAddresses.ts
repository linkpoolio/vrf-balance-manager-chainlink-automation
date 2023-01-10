export const setLinkTokenAddresses = (
  contract: any,
  erc677Address: string,
  erc20Address: string
) => {
  try {
    return contract.setLinkTokenAddresses(erc677Address, erc20Address);
  } catch (error: any) {
    throw new Error(
      `Error setting link token addresses. Reason: ${error.message}`
    );
  }
};
