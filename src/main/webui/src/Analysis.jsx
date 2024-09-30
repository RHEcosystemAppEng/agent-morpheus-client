import { Grid, GridItem, PageSection, PageSectionVariants, Text, TextContent } from "@patternfly/react-core";
import { ScanForm } from "./components/ScanForm";
import RequestPreview from "./components/RequestPreview";
import { useOutletContext } from "react-router-dom";

export default function Analysis() {

  const [vulnRequest, handleVulnRequestChange] = useOutletContext();

  return <PageSection variant={PageSectionVariants.light}>
    <Grid hasGutter>
      <GridItem>
        <TextContent>
          <Text component="h1">Request Vulnerabilty Analysis</Text>
        </TextContent>
      </GridItem>
      <GridItem>
        <ScanForm vulnRequest={vulnRequest} handleVulnRequestChange={handleVulnRequestChange} />
      </GridItem>
      <GridItem>
        <TextContent>
          <Text component="h1">Extracted Data</Text>
        </TextContent> </GridItem>
      <GridItem>
        <RequestPreview vulnRequest={vulnRequest} />
      </GridItem>
    </Grid>
  </PageSection>;
};