import { storiesOf } from "@storybook/react";
import SetParameters from "../src/components/WriteFunctions/SetParameters";

storiesOf("VRFBalancer", module).add("Set parameters for VRF Balancer.", () => (
  <div style={{ display: "flex", flexWrap: "wrap" }}>
    <SetParameters />
  </div>
));
