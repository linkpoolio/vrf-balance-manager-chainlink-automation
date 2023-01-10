import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { setLinkTokenAddresses } from "sdk/src/WriteFunctions/setLinkTokenAddresses";
import "../../styles/main.css";

function SetLinkTokenAddresses() {
  const [contractAddress, setContractAddress] = useState("");

  const [erc677Address, setErc677Address] = useState("");
  const [erc20Address, setErc20Address] = useState("");

  const [errorMessage, setErroMessage] = useState("");

  async function handleSetParameters() {
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);

      setLinkTokenAddresses(contract, erc677Address, erc20Address).catch(
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
        <h2>Set Link Token Addresses</h2>
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
          value={erc677Address}
          placeholder="erc677Address (address)"
          onChange={(e) => setErc677Address(e.target.value)}
        />
      </div>

      <div className="row">
        <input
          type="string"
          value={erc20Address}
          placeholder="erc20Address (address)"
          onChange={(e) => setErc20Address(e.target.value)}
        />
      </div>

      <div className="row">
        <button onClick={handleSetParameters}>Set Link Token Addresses</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default SetLinkTokenAddresses;
