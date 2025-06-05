import { Grid, GridItem, PageSection, Content,  } from "@patternfly/react-core";
import { ProductScanForm } from "./components/ProductScanForm";
import { useOutletContext } from "react-router-dom";

export default function Product() {

  const {handleVulnRequestChange, addAlert} = useOutletContext();

  return <PageSection hasBodyWrapper={false} >
    <Grid hasGutter>
      <GridItem>
        <Content>
          <Content component="h1">Request Product Vulnerabilty Analysis</Content>
        </Content>
      </GridItem>
      <GridItem>
        <ProductScanForm handleVulnRequestChange={handleVulnRequestChange} onNewAlert={addAlert} />
      </GridItem>
    </Grid>
  </PageSection>;
};