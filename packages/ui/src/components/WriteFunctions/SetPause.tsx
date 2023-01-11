import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { unpause } from "sdk/src/WriteFunctions/unpause";
import { pause } from "sdk/src/WriteFunctions/pause";

function SetPause() {
  const [contractAddress, setContractAddress] = useState("");
  const [errorMessage, setErroMessage] = useState("");

  async function handlePause() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      pause(contract).catch((error: any) => {
        setErroMessage(error.message);
      });
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  async function handleUnpause() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      unpause(contract).catch((error: any) => {
        setErroMessage(error.message);
      });
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h2>Set Pause</h2>
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
        <button onClick={handlePause}>Pause</button>
        <button onClick={handleUnpause}>Unpause</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default SetPause;
