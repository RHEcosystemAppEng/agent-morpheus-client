import { Grid, GridItem, PageSection, Content,  } from "@patternfly/react-core";
import { ProductScanForm } from "./components/ProductScanForm";
import { useOutletContext } from "react-router-dom";

export default function ProductAnalysis() {

  const {productVulnRequest, handleProductVulnRequestChange, addAlert} = useOutletContext();

  return <PageSection hasBodyWrapper={false} >
    <Grid hasGutter>
      <GridItem>
        <Content>
          <Content component="h1">Request Product Vulnerabilty Analysis</Content>
        </Content>
      </GridItem>
      <GridItem>
        <ProductScanForm productVulnRequest={productVulnRequest} handleProductVulnRequestChange={handleProductVulnRequestChange} onNewAlert={addAlert} />
      </GridItem>
    </Grid>
  </PageSection>;
};