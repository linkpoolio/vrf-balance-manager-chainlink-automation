export const parseAmount = (amount: string): Number => {
  try {
    return Number(amount);
  } catch (error: any) {
    throw new Error(`Error parsing amount. Reason: ${error.message}`);
  }
};

export const dexSwap = (
  contract: any,
  fromToken: string,
  toToken: string,
  amount: string
) => {
  try {
    const parsedAmount = parseAmount(amount);
    return contract.dexSwap(fromToken, toToken, parsedAmount);
  } catch (error: any) {
    throw new Error(`Error swapping. Reason: ${error.message}`);
  }
};
