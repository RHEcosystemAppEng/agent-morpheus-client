import { Grid, GridItem, PageSection, Content,  } from "@patternfly/react-core";
import ReportsTable from "./components/ReportsTable";

export default function Reports() {
  return <PageSection hasBodyWrapper={false} >
    <Grid hasGutter>
      <GridItem>
        <Content>
          <Content component="h1">Vulnerability Reports</Content>
        </Content>
      </GridItem>
      <GridItem>
        <ReportsTable />
      </GridItem>
    </Grid>
  </PageSection>;
};