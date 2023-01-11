import { storiesOf } from "@storybook/react";
import SetContractLINKMinBalance from "../src/components/WriteFunctions/SetContractLINKMinBalance";
import SetLinkTokenAddresses from "../src/components/WriteFunctions/SetLinkTokenAddresses";
import SetDEXAddress from "../src/components/WriteFunctions/SetDEXAddress";
import SetERC20Asset from "../src/components/WriteFunctions/SetERC20Asset";
import SetKeeperRegistryAddress from "../src/components/WriteFunctions/SetKeeperRegistryAddress";
import SetMinWaitPeriodSeconds from "../src/components/WriteFunctions/SetMinWaitPeriodSeconds";
import GetContractParameters from "../src/components/ReadFunctions/GetContractParameters";
import SetPegSwapRouter from "../src/components/WriteFunctions/SetPegSwapRouter";

storiesOf("Contract Parameters", module).add(
  "Set and get default parameters.",
  () => (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <SetContractLINKMinBalance />
      <SetLinkTokenAddresses />
      <SetDEXAddress />
      <SetERC20Asset />
      <SetKeeperRegistryAddress />
      <SetMinWaitPeriodSeconds />
      <SetPegSwapRouter />
      <GetContractParameters />
    </div>
  )
);
