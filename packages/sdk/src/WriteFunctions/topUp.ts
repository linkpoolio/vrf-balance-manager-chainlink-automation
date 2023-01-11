export const parseNeedsFunding = (needsFunding: string): Number[] => {
  try {
    return JSON.parse(needsFunding);
  } catch (error: any) {
    throw new Error(`Error parsing needs funding. Reason: ${error.message}`);
  }
};

export const topUp = async (contract: any, needsFunding: string) => {
  try {
    const parsedNeedsFunding = parseNeedsFunding(needsFunding);
    await contract.topUp(parsedNeedsFunding);
  } catch (error: any) {
    throw new Error(
      `Error topping up with parameter needsFunding: ${needsFunding}. Reason: ${
        error.message + JSON.stringify(error.data?.data?.stack)
      }`
    );
  }
};
