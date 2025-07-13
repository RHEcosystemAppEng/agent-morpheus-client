import { Grid, GridItem, PageSection, Content,  } from "@patternfly/react-core";
import ProductReportsTable from "./components/ProductReportsTable";

export default function ProductReports() {
  return <PageSection hasBodyWrapper={false} >
    <Grid hasGutter>
      <GridItem>
        <Content>
          <Content component="h1">Product Vulnerability Reports</Content>
        </Content>
      </GridItem>
      <GridItem>
        <ProductReportsTable />
      </GridItem>
    </Grid>
  </PageSection>;
};