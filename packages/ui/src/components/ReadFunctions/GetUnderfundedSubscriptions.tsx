import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { getUnderfundedSubscriptions } from "sdk/src/ReadFunctions/getUnderfundedSubscriptions";
import "../../styles/main.css";

function GetUnderfundedSubscriptions() {
  const [contractAddress, setContractAddress] = useState("");
  const [errorMessage, setErroMessage] = useState("");

  const [subscriptions, setSubscriptions] = useState("");

  async function handleGetUnderfundedSubscriptions() {
    setSubscriptions("");
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      getUnderfundedSubscriptions(contract)
        .then((res: any) => {
          setSubscriptions(res.join(", "));
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
        <h2>Get Subscriptions</h2>
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
        <button onClick={handleGetUnderfundedSubscriptions}>
          Get Underfunded Subcscriptions
        </button>
      </div>
      <div className="row">
        <p>Subcscriptions: {subscriptions}</p>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default GetUnderfundedSubscriptions;
