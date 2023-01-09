export const pegSwap = async (contract: any) => {
  try {
    await contract.pegSwap();
  } catch (error: any) {
    throw new Error(`Error peg swapping. Reason: ${error.message}`);
  }
};

export const setPegSwapRouter = async (contract: any, address: string) => {
  try {
    await contract.setPegSwapRouter(address);
  } catch (error: any) {
    throw new Error(`Error setting peg swap router. Reason: ${error.message}`);
  }
};


