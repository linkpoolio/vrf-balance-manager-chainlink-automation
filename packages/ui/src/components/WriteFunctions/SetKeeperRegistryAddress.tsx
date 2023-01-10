import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { setKeeperRegistryAddress } from "sdk/src/WriteFunctions/setKeeperRegistryAddress";
import "../../styles/main.css";

function SetKeeperRegistryAddress() {
  const [contractAddress, setContractAddress] = useState("");

  const [keeperRegistryAddress, setKeeperAddress] = useState("");

  const [errorMessage, setErroMessage] = useState("");

  async function handleSetParameters() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      setKeeperRegistryAddress(contract, keeperRegistryAddress).catch(
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
        <h2>Set Keeper Registry Address</h2>
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
          value={keeperRegistryAddress}
          placeholder="keeperRegistryAddress (address)"
          onChange={(e) => setKeeperAddress(e.target.value)}
        />
      </div>

      <div className="row">
        <button onClick={handleSetParameters}>
          Set Keeper Registry Address
        </button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default SetKeeperRegistryAddress;
