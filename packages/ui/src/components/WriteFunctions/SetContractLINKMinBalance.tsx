import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { setContractLINKMinBalance } from "sdk/src/WriteFunctions/setContractLINKMinBalance";
import "../../styles/main.css";

function SetContractLINKMinBalance() {
  const [contractAddress, setContractAddress] = useState("");

  const [LINKMinBalance, setLINKMinBalance] = useState("");

  const [errorMessage, setErroMessage] = useState("");

  async function handleSetLINKMinBalance() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);

      setContractLINKMinBalance(contract, LINKMinBalance).catch(
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
        <h2>Set LINK Min Balance</h2>
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
          value={LINKMinBalance}
          placeholder="LINKMinBalance (uint256)"
          onChange={(e) => setLINKMinBalance(e.target.value)}
        />
      </div>

      <div className="row">
        <button onClick={handleSetLINKMinBalance}>Set LINK Min Balance</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default SetContractLINKMinBalance;
