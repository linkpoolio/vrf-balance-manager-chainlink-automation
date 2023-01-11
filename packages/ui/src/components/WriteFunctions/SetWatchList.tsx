import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { setWatchList } from "sdk/src/WriteFunctions/setWatchList";
import "../../styles/main.css";

function SetWatchList() {
  const [contractAddress, setContractAddress] = useState("");

  const [subscriptionIds, setSubscriptionIds] = useState("");
  const [minBalances, setMinBalances] = useState("");
  const [topUpAmounts, setTopUpAmounts] = useState("");

  const [errorMessage, setErroMessage] = useState("");

  async function handleSetWatchList() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      setWatchList(contract, subscriptionIds, minBalances, topUpAmounts).catch(
        (error: any) => {
          setErroMessage(error.message);
        }
      );
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h2>Set Watch List</h2>
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
          value={subscriptionIds}
          placeholder="subscriptionIds (uint64[])"
          onChange={(e) => setSubscriptionIds(e.target.value)}
        />
      </div>

      <div className="row">
        <input
          type="string"
          value={minBalances}
          placeholder="minBalances (uint256[])"
          onChange={(e) => setMinBalances(e.target.value)}
        />
      </div>

      <div className="row">
        <input
          type="string"
          value={topUpAmounts}
          placeholder="topUpAmounts (uint256[])"
          onChange={(e) => setTopUpAmounts(e.target.value)}
        />
      </div>

      <div className="row">
        <button onClick={handleSetWatchList}>Set Watch List</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default SetWatchList;
