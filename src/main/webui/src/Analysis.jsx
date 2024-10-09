import { Grid, GridItem, PageSection, PageSectionVariants, Text, TextContent } from "@patternfly/react-core";
import { ScanForm } from "./components/ScanForm";
import { useOutletContext } from "react-router-dom";
import RequestPreview from "./components/RequestPreview";
import ExtractedData from "./components/ExtractedData";

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
      <GridItem>
        <TextContent>
          <Text component="h1">Extracted Data</Text>
        </TextContent> </GridItem>
      <GridItem>
        <ExtractedData vulnRequest={vulnRequest} />
      </GridItem>
      <GridItem>
        <TextContent>
          <Text component="h1">View Request</Text>
        </TextContent> </GridItem>
      <GridItem>
        <RequestPreview vulnRequest={vulnRequest} />
      </GridItem>
    </Grid>
  </PageSection>;
};