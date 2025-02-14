import { Grid, GridItem, PageSection, Content,  } from "@patternfly/react-core";
import VulnerabilitiesTable from "./components/VulnerabilitiesTable";

export default function Vulnerabilities() {
  return <PageSection hasBodyWrapper={false} >
    <Grid hasGutter>
      <GridItem>
        <Content>
          <Content component="h1">Vulnerabilities</Content>
        </Content>
      </GridItem>
      <GridItem>
        <VulnerabilitiesTable />
      </GridItem>
    </Grid>
  </PageSection>;
};