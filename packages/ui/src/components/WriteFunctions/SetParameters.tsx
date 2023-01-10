import { useState } from "react";
import { getContract } from "sdk/src/lib/utils";
import VRFBalancer from "sdk/src/abi/contracts/VRFBalancer.sol/VRFBalancer.json";
import {
  setKeeperRegistryAddress,
  setLinkTokenAddresses,
  setMinWaitPeriodSeconds,
  setDEXAddress,
  setContractLINKMinBalance,
  setERC20Asset,
} from "sdk/src/WriteFunctions/setParameters";
import "../../styles/main.css";

function SetParameters() {
  const [contractAddress, setContractAddress] = useState("");

  const [keeperRegistryAddress, setKeeperAddress] = useState("");
  const [erc677Address, setErc677Address] = useState("");
  const [erc20Address, setErc20Address] = useState("");
  const [minWaitPeriod, setMinWaitPeriod] = useState("");
  const [dexAddress, setAddress] = useState("");
  const [ERC20AssetAddress, setERC20AssetAddress] = useState("");
  const [LINKMinBalance, setLINKMinBalance] = useState("");

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
      setLinkTokenAddresses(contract, erc677Address, erc20Address).catch(
        (error: any) => {
          setErroMessage(error.message);
        }
      );
      setMinWaitPeriodSeconds(contract, minWaitPeriod).catch((error: any) => {
        setErroMessage(error.message);
      });
      setDEXAddress(contract, dexAddress).catch((error: any) => {
        setErroMessage(error.message);
      });
      setContractLINKMinBalance(contract, LINKMinBalance).catch(
        (error: any) => {
          setErroMessage(error.message);
        }
      );
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
        <h2>Set Parameters</h2>
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
        <input
          type="number"
          value={minWaitPeriod}
          placeholder="minWaitPeriod (uint256)"
          onChange={(e) => setMinWaitPeriod(e.target.value)}
        />
      </div>

      <div className="row">
        <input
          type="string"
          value={dexAddress}
          placeholder="dexAddress (address)"
          onChange={(e) => setAddress(e.target.value)}
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
        <input
          type="string"
          value={ERC20AssetAddress}
          placeholder="ERC20AssetAddress (address)"
          onChange={(e) => setERC20AssetAddress(e.target.value)}
        />
      </div>

      <div className="row">
        <button onClick={handleSetParameters}>Set Parameters</button>
      </div>
      <div className="row">
        <p>
          Error: <span className="error">{errorMessage}</span>
        </p>
      </div>
    </div>
  );
}

export default SetParameters;
