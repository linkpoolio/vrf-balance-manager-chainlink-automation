import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { topUp } from "sdk/src/WriteFunctions/topUp";

function TopUp() {
  const [contractAddress, setContractAddress] = useState("");
  const [errorMessage, setErroMessage] = useState("");

  const [needsFunding, setNeedsFunding] = useState("");

  async function handleTopUp() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      topUp(contract, needsFunding).catch((error: any) => {
        setErroMessage(error.message);
      });
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h2>Top up</h2>
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
          value={needsFunding}
          placeholder="needsFunding (uint64[])"
          onChange={(e) => setNeedsFunding(e.target.value)}
        />
      </div>

      <div className="row">
        <button onClick={handleTopUp}>Top up</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default TopUp;
