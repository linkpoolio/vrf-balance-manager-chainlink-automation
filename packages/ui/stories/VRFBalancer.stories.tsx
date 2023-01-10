import { storiesOf } from "@storybook/react";
import GetUnderfundedSubscriptions from "../src/components/ReadFunctions/GetUnderfundedSubscriptions";
import GetAssetBalance from "../src/components/ReadFunctions/GetAssetBalance";
import SetWatchList from "../src/components/WriteFunctions/SetWatchList";
import TopUp from "../src/components/WriteFunctions/TopUp";
import SetPause from "../src/components/WriteFunctions/SetPause";
import GetPauseStatus from "../src/components/ReadFunctions/GetPauseStatus";

storiesOf("VRF Balance Manager", module).add("Manage contract.", () => (
  <div style={{ display: "flex", flexWrap: "wrap" }}>
    <SetWatchList />
    <TopUp />
    <SetPause />
    <GetPauseStatus />
    <GetUnderfundedSubscriptions />
    <GetAssetBalance />
  </div>
));
