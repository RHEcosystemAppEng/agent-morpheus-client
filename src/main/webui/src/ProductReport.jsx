import { useParams, useLocation } from "react-router-dom";
import { getProduct } from "./services/ProductReportClient";
import { Breadcrumb, BreadcrumbItem, EmptyState, EmptyStateBody, Grid, GridItem, PageSection, Skeleton, Title, Card, CardHeader, CardTitle, CardBody } from "@patternfly/react-core";
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ReportsTable from "./components/ReportsTable";
import ProductReportDetails from "./components/ProductReportDetails";
import ProductAdditionalDetails from "./components/ProductAdditionalDetails.jsx";
import ProductCveStatusPieChart from "./components/ProductCveStatusPieChart";
import ComponentStatesPieChart from "./components/ComponentPieChart";
import { StatusLabel } from "./components/StatusLabel";


/**
 * @typedef {import('./types.js').Product} Product
 */

export default function ProductReport() {

  const params = useParams();
  const location = useLocation();
  
  const passedProductData = location.state?.productData;
  
  const [productData, setProductData] = React.useState(/** @type {Product | null} */(passedProductData || null));
  const [errorReport, setErrorReport] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(!passedProductData);
  const firstCve = Object.keys(productData?.summary?.cves ?? {})[0];
  
  const title = `${productData?.data?.name} / ${firstCve}`;
 
  React.useEffect(() => {
    if (!passedProductData) {
      getProduct(params.id)
        .then(summary => {
          setProductData(summary);
          setIsLoading(false);
        })
        .catch(e => {
          setErrorReport(e);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const showReport = () => {
    if (errorReport.status !== undefined) {
      if (errorReport.status === 404) {
        return <EmptyState headingLevel="h4" icon={CubesIcon} titleText="Product report not found">
          <EmptyStateBody>
            The selected product report with id: {params.id} has not been found. Go back to the product reports page and select a different product.
          </EmptyStateBody>
        </EmptyState>;
      } else {
        return <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText="Could not retrieve the selected report">
          <EmptyStateBody>
            <p>{errorReport.status}: {errorReport.message}</p>
            The selected product report with id: {params.id} could not be retrieved. Go back to the product reports page and select a different product.
          </EmptyStateBody>
        </EmptyState>;
      }
    }
 
    if (!productData) {
      return null;
    }
    return <Grid hasGutter>
      <Title headingLevel="h1">Product Report: <span style={{ fontSize: 'var(--pf-t--global--font--size--heading--h6)' }}>{title}</span></Title>
      <GridItem span={12}>
        <StatusLabel type={productData?.summary?.productState} size="large" />
      </GridItem>
      <GridItem span={6}>            
        <ProductReportDetails product={productData} />
      </GridItem>
      <GridItem span={6}>
        <ProductAdditionalDetails product={productData} />
      </GridItem>
      <GridItem span={6}>
        <Card style={{ padding: 'unset' }}>
          <CardTitle><Title headingLevel="h4" size="xl">Repository scan distribution</Title></CardTitle>
          <CardBody>
            <ComponentStatesPieChart
              componentStates={productData?.summary.componentStates}
              submittedCount={productData?.data.submittedCount}
            />              
          </CardBody>
        </Card>
    </GridItem>

      <GridItem span={6}>
        <Card style={{ padding: 'unset' }}>
          <CardTitle><Title headingLevel="h4" size="xl">ExploitIQ statuses</Title></CardTitle>
          <CardBody>
            <ProductCveStatusPieChart productId={params.id} />
          </CardBody>
        </Card>
      </GridItem>

      <GridItem span={12}>
        <ReportsTable
          initSearchParams={
            (() => {
              const newParams = new URLSearchParams();
              newParams.set("product_id", params.id);
              return newParams;
            })()
          }
        />
      
      </GridItem>
    </Grid>
  }

  return <PageSection hasBodyWrapper={false} >
    <Breadcrumb>
      <BreadcrumbItem to="#/product-reports">Product Reports</BreadcrumbItem>
      <BreadcrumbItem>{title}</BreadcrumbItem>
    </Breadcrumb>
    {isLoading ? <Skeleton screenreaderText="Loading contents" /> : showReport()}
  </PageSection>;

}