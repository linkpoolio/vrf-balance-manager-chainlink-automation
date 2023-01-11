export const parseAmount = (amount: string): Number => {
  try {
    return Number(amount);
  } catch (error: any) {
    throw new Error(`Error parsing amount. Reason: ${error.message}`);
  }
};

export const withdraw = (contract: any, amount: string, payee: string) => {
  try {
    const parsedAmount = parseAmount(amount);
    return contract.withdraw(parsedAmount, payee);
  } catch (error: any) {
    throw new Error(`Error withdrawing. Reason: ${error.message}`);
  }
};
