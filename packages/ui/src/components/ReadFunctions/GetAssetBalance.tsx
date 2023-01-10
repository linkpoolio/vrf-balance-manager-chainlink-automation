import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { getAssetBalance } from "../../../../sdk/src/ReadFunctions/getAssetBalance";
import "../../styles/main.css";

function GetAssetBalance() {
  const [contractAddress, setContractAddress] = useState("");
  const [errorMessage, setErroMessage] = useState("");

  const [asset, setAsset] = useState("");

  const [balance, setBalance] = useState("");

  async function handleGetBalance() {
    setBalance("");
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      getAssetBalance(contract, asset)
        .then((res: any) => {
          setBalance(String(res));
        })
        .catch((error: any) => {
          setErroMessage(error.message);
        });
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h2>Get Asset Balance</h2>
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
          value={asset}
          placeholder="asset (address)"
          onChange={(e) => setAsset(e.target.value)}
        />
      </div>
      <div className="row">
        <button onClick={handleGetBalance}>Get Balance</button>
      </div>
      <div className="row">
        <p>Balance: {balance}</p>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default GetAssetBalance;
