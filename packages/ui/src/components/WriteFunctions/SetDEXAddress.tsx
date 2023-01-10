import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { setDEXAddress } from "sdk/src/WriteFunctions/setDEXAddress";
import "../../styles/main.css";

function SetDEXAddress() {
  const [contractAddress, setContractAddress] = useState("");

  const [dexAddress, setAddress] = useState("");

  const [errorMessage, setErroMessage] = useState("");

  async function handleSetDEXAddress() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);

      setDEXAddress(contract, dexAddress).catch((error: any) => {
        setErroMessage(error.message);
      });
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h2>Set Dex Address</h2>
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
          value={dexAddress}
          placeholder="dexAddress (address)"
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div className="row">
        <button onClick={handleSetDEXAddress}>Set DEX Address</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default SetDEXAddress;
