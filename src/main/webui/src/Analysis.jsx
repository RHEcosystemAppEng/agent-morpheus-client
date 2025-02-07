import { Grid, GridItem, PageSection, PageSectionVariants, Text, TextContent } from "@patternfly/react-core";
import { ScanForm } from "./components/ScanForm";
import { useOutletContext } from "react-router-dom";

export default function Analysis() {

  const {vulnRequest, handleVulnRequestChange, addAlert} = useOutletContext();

  return <PageSection variant={PageSectionVariants.light}>
    <Grid hasGutter>
      <GridItem>
        <TextContent>
          <Text component="h1">Request Vulnerabilty Analysis</Text>
        </TextContent>
      </GridItem>
      <GridItem>
        <ScanForm vulnRequest={vulnRequest} handleVulnRequestChange={handleVulnRequestChange} onNewAlert={addAlert} />
      </GridItem>
    </Grid>
  </PageSection>;
};