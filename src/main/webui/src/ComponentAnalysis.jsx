import { Grid, GridItem, PageSection, PageSectionVariants, Text, TextContent } from "@patternfly/react-core";
import { useOutletContext } from "react-router-dom";

import { ComponentScanForm } from "./components/ComponentScanForm";

export default function ComponentAnalysis() {

  const {vulnRequest, handleVulnRequestChange, addAlert} = useOutletContext();

  return <PageSection variant={PageSectionVariants.light}>
    <Grid hasGutter>
      <GridItem>
        <TextContent>
          <Text component="h1">Request Vulnerabilty Analysis</Text>
        </TextContent>
      </GridItem>
      <GridItem>
        <ComponentScanForm vulnRequest={vulnRequest} handleVulnRequestChange={handleVulnRequestChange} onNewAlert={addAlert} />
      </GridItem>
    </Grid>
  </PageSection>;
};