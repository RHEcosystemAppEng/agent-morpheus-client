import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { deleteProductReport, getProduct } from "./services/ProductReportClient";
import { Breadcrumb, BreadcrumbItem, Button, Divider, EmptyState, EmptyStateBody, Flex, Grid, GridItem, PageSection, Panel, Skeleton, Content, ContentVariants, getUniqueId, List, ListComponent, ListItem, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription, DescriptionList, Label, Title } from "@patternfly/react-core";
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ConfirmationButton } from "./components/ConfirmationButton";
import ReportsTable from "./components/ReportsTable";
import JustificationBanner from "./components/JustificationBanner";

export default function ProductReport() {

  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const passedProductData = location.state?.productData;
  
  const [productData, setProductData] = React.useState(passedProductData || null);
  const [errorReport, setErrorReport] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(!passedProductData);


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

  // const time_meta_fields = [
  //   "submitted_at",
  //   "sent_at"
  // ];

  // const time_scan_fields = [
  //   "started_at",
  //   "completed_at"
  // ];

  // const timestamp_labels = {
  //   "submitted_at": "Submitted",
  //   "sent_at": "Sent",
  //   "started_at": "Started",
  //   "completed_at": "Completed"
  // };

  const onDelete = () => {
    deleteProductReport(params.id).then(() => navigate('/product-reports'));
  }

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

    // if (report.input === undefined) {
    //   return <>
    //     <Skeleton screenreaderText="Loading contents" />
    //     <br />
    //     <Skeleton width="40%" screenreaderText="Loading contents" />
    //     <Skeleton width="35%" screenreaderText="Loading contents" />
    //     <br />
    //     <Skeleton screenreaderText="Loading contents" />
    //     <br />
    //     <Skeleton screenreaderText="Loading contents" />
    //     <br />
    //     <Divider />
    //     <br />
    //     <Skeleton width="10%" screenreaderText="Loading contents" />
    //     <br />
    //     <Skeleton screenreaderText="Loading contents" />
    //     <Skeleton screenreaderText="Loading contents" />
    //   </>;
    // }

    // const image = report.input.image
    // const output = report.output;
    // let metadata = [];
    // let timestamps = [];
    // if (report.metadata !== undefined) {
    //   Object.keys(report.metadata).forEach(k => {
    //     if (time_meta_fields.includes(k)) {
    //       timestamps.push({ key: k, value: report.metadata[k]["$date"] });
    //     } else {
    //       metadata.push({ key: k, value: report.metadata[k] });
    //     }
    //   });
    // }
    // time_scan_fields.forEach(field => {
    //   if(report.input.scan[field] !== undefined) {
    //     timestamps.push({ key: field, value: report.input.scan[field] });
    //   }
    // });

    return <Grid hasGutter>
      <Content component="h1">{params.id}</Content>
      <DescriptionList isHorizontal isCompact>
        <DescriptionListGroup>
          <DescriptionListTerm>Submitted</DescriptionListTerm>
          <DescriptionListDescription>
            {productData?.submittedAt || null}
          </DescriptionListDescription>
        </DescriptionListGroup>
        {/* <DescriptionListGroup>
          <DescriptionListTerm>Completed</DescriptionListTerm>
          <DescriptionListDescription>
            {productData?.completedAt || "TBD"}
          </DescriptionListDescription>
        </DescriptionListGroup> */}
        <DescriptionListGroup>
          <DescriptionListTerm>CVEs</DescriptionListTerm>
          <DescriptionListDescription>
            {productData?.cves && Object.keys(productData.cves).length > 0 ? (
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                {Object.entries(productData.cves).map(([cve, justifications]) => {
                  const uid = getUniqueId("div");
                  return (
                    <div key={uid}>
                      <Flex direction={{ default: 'row' }} spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                        <Link to={`/reports?vulnId=${cve}`}>
                          {cve}
                        </Link>
                        {justifications.length > 0 && 
                          justifications.map((justification, index) => (
                            <JustificationBanner key={`${uid}-${index}`} justification={justification} />
                          ))
                        }
                      </Flex>
                    </div>
                  );
                })}
              </Flex>
            ) : null}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      <div>
        <ReportsTable
          initSearchParams={
            (() => {
              const newParams = new URLSearchParams();
              newParams.set("product_id", params.id);
              return newParams;
            })()
          }
        />
      </div>

      <GridItem>
        <Flex columnGap={{ default: 'columnGapSm' }}>
          <ConfirmationButton btnVariant="danger"
            onConfirm={() => onDelete()}
            message={`The Product report with id: ${params.id} will be permanently deleted.`}>Delete</ConfirmationButton>
          <Button variant="primary" onClick={() => navigate(-1)}>Back</Button>
        </Flex>
      </GridItem>
    </Grid>
  }

  return <PageSection hasBodyWrapper={false} >
    <Breadcrumb>
      <BreadcrumbItem to="#/product-reports">Product Reports</BreadcrumbItem>
      <BreadcrumbItem>{params.id}</BreadcrumbItem>
    </Breadcrumb>
    {isLoading ? <Skeleton screenreaderText="Loading contents" /> : showReport()}
  </PageSection>;

}