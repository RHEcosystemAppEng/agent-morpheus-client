import { useParams } from "react-router";
import {
  PageSection,
  Grid,
  GridItem,
  Spinner,
  Alert,
  AlertVariant,
} from "@patternfly/react-core";
import { useReport } from "../hooks/useReport";
import ReportDetails from "../components/ReportDetails";
import ReportAdditionalDetails from "../components/ReportAdditionalDetails";
import ReportCveStatusPieChart from "../components/ReportCveStatusPieChart";
import ReportComponentStatesPieChart from "../components/ReportComponentStatesPieChart";
import RepositoryReportsTable from "../components/RepositoryReportsTable";

const ReportPage: React.FC = () => {
  const { productId, cveId } = useParams<{ productId: string; cveId: string }>();

  const { data, loading, error } = useReport(productId || "");

  if (loading) {
    return (
      <PageSection>
        <Spinner aria-label="Loading report data" />
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.danger} title="Error loading report">
          {error.message}
        </Alert>
      </PageSection>
    );
  }

  if (!data || !productId || !cveId) {
    return (
      <PageSection>
        <Alert variant={AlertVariant.warning} title="Invalid report">
          Report not found or invalid parameters.
        </Alert>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <ReportDetails productSummary={data} cveId={cveId} />
          </GridItem>
          <GridItem span={6}>
            <ReportAdditionalDetails productSummary={data} />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <ReportComponentStatesPieChart productSummary={data} />
          </GridItem>
          <GridItem span={6}>
            <ReportCveStatusPieChart productSummary={data} cveId={cveId} />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <RepositoryReportsTable productId={productId} cveId={cveId} />
      </PageSection>
    </>
  );
};

export default ReportPage;

