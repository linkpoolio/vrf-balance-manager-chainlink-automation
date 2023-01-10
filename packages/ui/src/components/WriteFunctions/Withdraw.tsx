import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { withdraw } from "sdk/src/WriteFunctions/withdraw";

function Withdraw() {
  const [contractAddress, setContractAddress] = useState("");
  const [errorMessage, setErroMessage] = useState("");

  const [amount, setAmount] = useState("");
  const [payee, setPayee] = useState("");

  async function handleWithdraw() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      withdraw(contract, amount, payee).catch((error: any) => {
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
          type="number"
          value={amount}
          placeholder="amount (uint256)"
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="row">
        <input
          type="string"
          value={payee}
          placeholder="payee (string)"
          onChange={(e) => setPayee(e.target.value)}
        />
      </div>

      <div className="row">
        <button onClick={handleWithdraw}>Withdraw</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default Withdraw;
