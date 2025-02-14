import { Grid, GridItem, PageSection, Content,  } from "@patternfly/react-core";
import { ScanForm } from "./components/ScanForm";
import { useOutletContext } from "react-router-dom";

export default function Analysis() {

  const {vulnRequest, handleVulnRequestChange, addAlert} = useOutletContext();

  return <PageSection hasBodyWrapper={false} >
    <Grid hasGutter>
      <GridItem>
        <Content>
          <Content component="h1">Request Vulnerabilty Analysis</Content>
        </Content>
      </GridItem>
      <GridItem>
        <ScanForm vulnRequest={vulnRequest} handleVulnRequestChange={handleVulnRequestChange} onNewAlert={addAlert} />
      </GridItem>
    </Grid>
  </PageSection>;
};