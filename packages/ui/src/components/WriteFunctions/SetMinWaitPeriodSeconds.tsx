import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { setMinWaitPeriodSeconds } from "sdk/src/WriteFunctions/setMinWaitPeriodSeconds";
import "../../styles/main.css";

function SetMinWaitPeriodSeconds() {
  const [contractAddress, setContractAddress] = useState("");

  const [minWaitPeriod, setMinWaitPeriod] = useState("");

  const [errorMessage, setErroMessage] = useState("");

  async function handleSetParameters() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);

      setMinWaitPeriodSeconds(contract, minWaitPeriod).catch((error: any) => {
        setErroMessage(error.message);
      });
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h2>Set Min Wait Period in Seconds</h2>
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
          type="number"
          value={minWaitPeriod}
          placeholder="minWaitPeriod (uint256)"
          onChange={(e) => setMinWaitPeriod(e.target.value)}
        />
      </div>

      <div className="row">
        <button onClick={handleSetParameters}>Set period</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default SetMinWaitPeriodSeconds;
