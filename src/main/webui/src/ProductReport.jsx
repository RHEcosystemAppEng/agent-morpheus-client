import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { deleteProductReport, getProduct, getFailedComponents } from "./services/ProductReportClient";
import { Breadcrumb, BreadcrumbItem, Button, EmptyState, EmptyStateBody, Flex, Grid, GridItem, PageSection, Skeleton, Content, getUniqueId, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription, DescriptionList, Label, Title, TextInput, Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ConfirmationButton } from "./components/ConfirmationButton";
import ReportsTable from "./components/ReportsTable";
import JustificationBanner from "./components/JustificationBanner";
import { StatusLabel } from "./components/StatusLabel";
import ComponentStatesPieChart from "./components/ComponentPieChart";

export default function ProductReport() {

  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const passedProductData = location.state?.productData;
  
  const [productData, setProductData] = React.useState(passedProductData || null);
  const [errorReport, setErrorReport] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(!passedProductData);
  const [submissionFailures, setSubmissionFailures] = React.useState([]);
  const [errorSubmissionFailures, setErrorSubmissionFailures] = React.useState({});
  const [errorMessageFilter, setErrorMessageFilter] = React.useState('');

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

  React.useEffect(() => {
    getFailedComponents(params.id)
      .then(failures => {
        setSubmissionFailures(failures);
      })
      .catch(e => {
        setErrorSubmissionFailures(e);
      });
  }, []);

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

    const submissionFailuresColumnNames = [
      { key: 'image', label: 'Component' },
      { key: 'tag', label: 'Version' },
      { key: 'error', label: 'Error' }
    ];
  
    const emptySubmissionFailuresTable = () => {
      return <EmptyState>
        <EmptyStateBody>
          No component submission failures found for this product.
        </EmptyStateBody>
      </EmptyState>;
    };

    const errorSubmissionFailuresTable = () => {
      return <EmptyState>
        <EmptyStateBody>
          {errorSubmissionFailures.status}: {errorSubmissionFailures.message}
        </EmptyStateBody>
      </EmptyState>;
    }

    const submissionFailuresTable = () => {
      const filteredFailures = submissionFailures.filter(failure => 
        failure.error.toLowerCase().includes(errorMessageFilter.toLowerCase())
      );
      
      return filteredFailures.map((failure, index) => {
        return <Tr key={failure.imageName} style={{ borderBottom: 'none' }}>
          <Td dataLabel={submissionFailuresColumnNames[0].label} modifier="nowrap">{failure.imageName}</Td>
          <Td dataLabel={submissionFailuresColumnNames[1].label} modifier="nowrap">{failure.imageVersion}</Td>
          <Td dataLabel={submissionFailuresColumnNames[2].label} modifier="nowrap">
            <span
            title={failure.error}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '1200px',
              display: 'inline-block',
              verticalAlign: 'bottom',
            }}
            >
              {failure.error}
            </span>
          </Td>
        </Tr>
      });
    }

    const getFilteredSubmissionFailuresCount = () => {
      return submissionFailures.filter(failure => 
        failure.error.toLowerCase().includes(errorMessageFilter.toLowerCase())
      ).length;
    }

    return <Grid hasGutter>
      <Title headingLevel="h1">{params.id}</Title>
      {productData ? (
        <div>
          <StatusLabel type={productData.state} size="large" />
        </div>
      ) : null}
      <DescriptionList isHorizontal isCompact>
        <DescriptionListGroup>
          <DescriptionListTerm>Submitted At</DescriptionListTerm>
          <DescriptionListDescription>
            {productData?.submittedAt || null}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Completed At</DescriptionListTerm>
          <DescriptionListDescription>
            {productData?.completedAt || "-"}
          </DescriptionListDescription>
        </DescriptionListGroup>
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
        <Title headingLevel="h2">State Distribution</Title>
        <ComponentStatesPieChart 
          componentStates={productData?.componentStates} 
          submittedCount={productData?.submittedCount}
        />
      </div>

      <div>
        <Title headingLevel="h2" style={{ marginBottom: '20px' }}>Product Components - Submitted and Sent for Scanning</Title>
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

      <div style={{ marginTop: '24px' }}>
        <Title headingLevel="h2">Product Components - Failed to Submit</Title>
        {submissionFailures.length > 0 ? (
          <>
            <Toolbar style={{ padding: 0 }}>
              <ToolbarContent>
                <ToolbarItem alignment={{ default: 'alignRight' }} variant="pagination" style={{ marginRight: '70px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
                    {errorMessageFilter && (
                      <Button 
                        variant="link" 
                        onClick={() => setErrorMessageFilter('')}
                      >
                        Clear
                      </Button>
                    )}
                    <TextInput
                      type="text"
                      id="error-message-filter"
                      placeholder="Filter by error message..."
                      value={errorMessageFilter}
                      onChange={(_event, value) => setErrorMessageFilter(value)}
                      style={{ minWidth: '500px' }}
                    />
                  </div>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            {getFilteredSubmissionFailuresCount() > 0 ? (
              <Table>
                <Thead>
                  <Tr>
                    <Th>{submissionFailuresColumnNames[0].label}</Th>
                    <Th>{submissionFailuresColumnNames[1].label}</Th>
                    <Th>{submissionFailuresColumnNames[2].label}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {submissionFailuresTable()}
                </Tbody>
              </Table>
            ) : (
              <EmptyState>
                <EmptyStateBody>
                  No submission failures match the current filter.
                </EmptyStateBody>
              </EmptyState>
            )}
          </>
        ) : errorSubmissionFailures.status !== undefined ? (
          errorSubmissionFailuresTable()
        ) : emptySubmissionFailuresTable()}
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