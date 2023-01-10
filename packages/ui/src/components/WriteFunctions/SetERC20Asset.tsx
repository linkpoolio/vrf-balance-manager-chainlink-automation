import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { setERC20Asset } from "sdk/src/WriteFunctions/setERC20Asset";
import "../../styles/main.css";

function SetERC20Asset() {
  const [contractAddress, setContractAddress] = useState("");

  const [ERC20AssetAddress, setERC20AssetAddress] = useState("");

  const [errorMessage, setErroMessage] = useState("");

  async function handleSetParameters() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      setERC20Asset(contract, ERC20AssetAddress).catch((error: any) => {
        setErroMessage(error.message);
      });
    } catch (error: any) {
      setErroMessage(error.message);
    }
  }

  return (
    <div className="container">
      <div className="row">
        <h2>Set ERC20 Asset</h2>
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
          value={ERC20AssetAddress}
          placeholder="ERC20AssetAddress (address)"
          onChange={(e) => setERC20AssetAddress(e.target.value)}
        />
      </div>

      <div className="row">
        <button onClick={handleSetParameters}>Set ERC20 Asset</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default SetERC20Asset;
