import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { getPegSwapRouter } from "../../../../sdk/src/ReadFunctions/pegswap";
import "../../styles/main.css";

function GetPegswapRouter() {
  const [contractAddress, setContractAddress] = useState("");
  const [errorMessage, setErroMessage] = useState("");

  const [router, setRouter] = useState("");

  async function handleGetRouter() {
    setRouter("");
    setErroMessage("");
    try {
      const contract = getContract(contractAddress, VRFBalancer);
      getPegSwapRouter(contract)
        .then((res: any) => {
          setRouter(res);
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
        <h2>Get Pegswap Router</h2>
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
        <button onClick={handleGetRouter}>Get Pegswap Router</button>
      </div>
      <div className="row">
        <p>Router Address: {router}</p>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default GetPegswapRouter;
