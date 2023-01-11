import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { isPaused } from "sdk/src/ReadFunctions/isPaused";
import "../../styles/main.css";

function GetPauseStatus() {
  const [contractAddress, setContractAddress] = useState("");
  const [errorMessage, setErroMessage] = useState("");

  const [paused, setPaused] = useState("");

  async function handleGetPaused() {
    setPaused("");
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      isPaused(contract)
        .then((res: any) => {
          setPaused(String(res));
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
        <h2>Get Pause Status</h2>
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
        <button onClick={handleGetPaused}>Get Paused</button>
      </div>
      <div className="row">
        <p>Is paused: {paused}</p>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default GetPauseStatus;
