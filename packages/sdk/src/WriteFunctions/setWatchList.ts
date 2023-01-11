export const parseSubcriptionIds = (subscriptionIds: string): Number[] => {
  try {
    return JSON.parse(subscriptionIds);
  } catch (error: any) {
    throw new Error(`Error parsing subscription ids. Reason: ${error.message}`);
  }
};

export const parseMinBalances = (minBalances: string): Number[] => {
  try {
    return JSON.parse(minBalances);
  } catch (error: any) {
    throw new Error(`Error parsing min balances. Reason: ${error.message}`);
  }
};

export const parseTopUpAmounts = (topUpAmounts: string): Number[] => {
  try {
    return JSON.parse(topUpAmounts);
  } catch (error: any) {
    throw new Error(`Error parsing top up amounts. Reason: ${error.message}`);
  }
};

export const setWatchList = (
  contract: any,
  subscriptionIds: string,
  minBalances: string,
  topUpAmounts: string
) => {
  try {
    const subscriptionIdsArray = parseSubcriptionIds(subscriptionIds);
    const minBalancesArray = parseMinBalances(minBalances);
    const topUpAmountsArray = parseTopUpAmounts(topUpAmounts);
    return contract.setWatchList(
      subscriptionIdsArray,
      minBalancesArray,
      topUpAmountsArray
    );
  } catch (error: any) {
    throw new Error(`Error setting watch list. Reason: ${error.message}`);
  }
};
