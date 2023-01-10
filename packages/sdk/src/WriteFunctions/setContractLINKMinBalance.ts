export const parseAmount = (amount: string): Number => {
  try {
    return Number(amount);
  } catch (error: any) {
    throw new Error(`Error parsing amount. Reason: ${error.message}`);
  }
};

export const setContractLINKMinBalance = (contract: any, amount: string) => {
  try {
    const parsedAmount = parseAmount(amount);
    return contract.setContractLINKMinBalance(parsedAmount);
  } catch (error: any) {
    throw new Error(
      `Error setting contract LINK min balance. Reason: ${error.message}`
    );
  }
};
