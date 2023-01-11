import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import { getKeeperRegistryAddress } from "sdk/src/ReadFunctions/getKeeperRegistryAddress";
import { getContractLINKMinBalance } from "sdk/src/ReadFunctions/getContractLINKMinBalance";
import { getERC20Asset } from "sdk/src/ReadFunctions/getERC20Asset";
import { getERC677LinkAddress } from "sdk/src/ReadFunctions/getERC677LinkAddress";
import { getERC20LinkAddress } from "sdk/src/ReadFunctions/getERC20LinkAddress";
import { getDEXAddress } from "sdk/src/ReadFunctions/getDEXAddress";
import { getMinWaitPeriodSeconds } from "sdk/src/ReadFunctions/getMinWaitPeriodSeconds";
import { getPegSwapRouter } from "../../../../sdk/src/ReadFunctions/pegswap";

import "../../styles/main.css";

function GetContractParameters() {
  const [contractAddress, setContractAddress] = useState("");

  const [keeperRegistryAddress, setKeeperAddress] = useState("");
  const [erc677Address, setErc677Address] = useState("");
  const [erc20Address, setErc20Address] = useState("");
  const [minWaitPeriod, setMinWaitPeriod] = useState("");
  const [dexAddress, setAddress] = useState("");
  const [ERC20AssetAddress, setERC20AssetAddress] = useState("");
  const [LINKMinBalance, setLINKMinBalance] = useState("");
  const [router, setRouter] = useState("");

  const [errorMessage, setErroMessage] = useState("");

  async function handleGetParameters() {
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
      getKeeperRegistryAddress(contract)
        .then((res: any) => {
          setKeeperAddress(res);
        })
        .catch((error: any) => {
          setErroMessage(error.message);
        });
      getContractLINKMinBalance(contract)
        .then((res: any) => {
          setLINKMinBalance(res.toString());
        })
        .catch((error: any) => {
          setErroMessage(error.message);
        });
      getERC20Asset(contract)
        .then((res: any) => {
          setERC20AssetAddress(res);
        })
        .catch((error: any) => {
          setErroMessage(error.message);
        });
      getDEXAddress(contract)
        .then((res: any) => {
          setAddress(res);
        })
        .catch((error: any) => {
          setErroMessage(error.message);
        });
      getMinWaitPeriodSeconds(contract)
        .then((res: any) => {
          setMinWaitPeriod(res.toString());
        })
        .catch((error: any) => {
          setErroMessage(error.message);
        });
      getERC20LinkAddress(contract)
        .then((res: any) => {
          setErc20Address(res);
        })
        .catch((error: any) => {
          setErroMessage(error.message);
        });
      getERC677LinkAddress(contract)
        .then((res: any) => {
          setErc677Address(res);
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
        <h2>Get Contract Parameters</h2>
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
        <button onClick={handleGetParameters}>Get Parameters</button>
      </div>

      <div className="row">
        <p>Keeper Registry Address: {keeperRegistryAddress}</p>
      </div>

      <div className="row">
        <p>ERC677 LINK Address: {erc677Address}</p>
      </div>

      <div className="row">
        <p>ERC20 LINK Address: {erc20Address}</p>
      </div>

      <div className="row">
        <p>Min Wait Period: {minWaitPeriod}</p>
      </div>

      <div className="row">
        <p>DEX Address: {dexAddress}</p>
      </div>

      <div className="row">
        <p>PegSwap Router Address: {router}</p>
      </div>

      <div className="row">
        <p>LINK Min Balance: {LINKMinBalance}</p>
      </div>
      <div className="row">
        <p>ERC20 Asset Address: {ERC20AssetAddress}</p>
      </div>

      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default GetContractParameters;
