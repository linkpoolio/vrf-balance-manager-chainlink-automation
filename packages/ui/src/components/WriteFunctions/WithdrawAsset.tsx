import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { withdrawAsset } from "sdk/src/WriteFunctions/withdrawAsset";

function WithdrawAsset() {
  const [contractAddress, setContractAddress] = useState("");
  const [errorMessage, setErroMessage] = useState("");

  const [assetAddress, setAssetAddress] = useState("");

  async function handleWithdrawAsset() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      withdrawAsset(contract, assetAddress).catch((error: any) => {
        setErroMessage(error.message);
      });
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h2>Withdraw</h2>
      </div>
      <div className="row">
        <input
          type="string"
          value={contractAddress}
          placeholder="contractAddress (address)"
          onChange={(e) => setContractAddress(e.target.value)}
        />
      </div>

      <div className="row">
        <input
          type="string"
          value={assetAddress}
          placeholder="asset (address)"
          onChange={(e) => setAssetAddress(e.target.value)}
        />
      </div>

      <div className="row">
        <button onClick={handleWithdrawAsset}>Withdraw Asset</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default WithdrawAsset;
