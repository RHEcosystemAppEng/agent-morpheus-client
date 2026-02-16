import { useParams, Link } from "react-router";
import {
  PageSection,
  Grid,
  GridItem,
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbItem,
  Title,
} from "@patternfly/react-core";
import { useReport } from "../hooks/useReport";
import ReportDetails from "../components/ReportDetails";
import ReportAdditionalDetails from "../components/ReportAdditionalDetails";
import ReportCveStatusPieChart from "../components/ReportCveStatusPieChart";
import ReportComponentStatesPieChart from "../components/ReportComponentStatesPieChart";
import RepositoryReportsTable from "../components/RepositoryReportsTable";
import ReportPageSkeleton from "../components/ReportPageSkeleton";
import { getErrorMessage } from "../utils/errorHandling";

const ReportPage: React.FC = () => {
  const { productId, cveId } = useParams<{ productId: string; cveId: string }>();

  const { data, loading, error } = useReport(productId);

  if (loading) {
    return <ReportPageSkeleton />;
  }

  if (!productId || !cveId) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.warning} title="Invalid report">
          Invalid page parameters. Should be /reports/product/:productId/:cveId.
        </Alert>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Error loading report">
          {getErrorMessage(error)}
        </Alert>
      </PageSection>
    );
  }

  if (!data) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Report not found">
          Unexpected error: API returned no data.          
        </Alert>
      </PageSection>
    );
  }
  const productName = data.data.name;
  const breadcrumbText = `${productName}/${cveId}`;  

  return (
    <>
      <PageSection>
        <Grid hasGutter>
          <GridItem>
            <Breadcrumb>
              <BreadcrumbItem>
                <Link to="/reports">Reports</Link>
              </BreadcrumbItem>
              <BreadcrumbItem isActive>{breadcrumbText}</BreadcrumbItem>
            </Breadcrumb>
          </GridItem>
          <GridItem>                          
            <Title headingLevel="h1" size="2xl">
              <strong>Report:</strong> {breadcrumbText}
            </Title>                                       
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <ReportDetails product={data} cveId={cveId} />
          </GridItem>
          <GridItem span={6}>
            <ReportAdditionalDetails product={data} />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <ReportComponentStatesPieChart product={data} />
          </GridItem>
          <GridItem span={6}>
            <ReportCveStatusPieChart product={data} cveId={cveId} />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <RepositoryReportsTable productId={productId} cveId={cveId} product={data} />
      </PageSection>
    </>
  );
};

export default ReportPage;
