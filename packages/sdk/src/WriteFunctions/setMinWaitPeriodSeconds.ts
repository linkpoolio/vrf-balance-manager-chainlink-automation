export const parsePeriod = (period: string): Number => {
  try {
    return Number(period);
  } catch (error: any) {
    throw new Error(`Error parsing period. Reason: ${error.message}`);
  }
};

export const setMinWaitPeriodSeconds = (contract: any, period: string) => {
  try {
    const parsedPeriod = parsePeriod(period);
    return contract.setMinWaitPeriodSeconds(parsedPeriod);
  } catch (error: any) {
    throw new Error(
      `Error setting min wait period seconds. Reason: ${error.message}`
    );
  }
};
