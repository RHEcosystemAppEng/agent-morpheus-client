import { useParams, Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Title,
  Grid,
  GridItem,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { useRepositoryReport } from "../hooks/useRepositoryReport";
import { getErrorMessage } from "../utils/errorHandling";
import DetailsCard from "../components/DetailsCard";
import ChecklistCard from "../components/ChecklistCard";
import RepositoryAdditionalDetailsCard from "../components/RepositoryAdditionalDetailsCard";
import RepositoryReportPageSkeleton from "../components/RepositoryReportPageSkeleton";
import DownloadDropdown from "../components/DownloadVex";

interface RepositoryReportPageErrorProps {
  title: string;
  message: string | React.ReactNode;
}

const RepositoryReportPageError: React.FC<RepositoryReportPageErrorProps> = ({
  title,
  message,
}) => {
  return (
    <PageSection>
      <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText={title}>
        <EmptyStateBody>{message}</EmptyStateBody>
      </EmptyState>
    </PageSection>
  );
};

interface RepositoryReportPageApiErrorProps {
  error: Error;
  reportId: string;
}

const RepositoryReportPageApiError: React.FC<RepositoryReportPageApiErrorProps> = ({
  error,
  reportId,
}) => {
  const errorStatus = (error as { status?: number })?.status;
  const title =
    errorStatus === 404
      ? "Report not found"
      : "Could not retrieve the selected report";
  const message =
    errorStatus === 404 ? (
      `The selected report with id: ${reportId} has not been found.`
    ) : (
      <>
        <p>
          {errorStatus || "Error"}: {getErrorMessage(error)}
        </p>
        The selected report with id: {reportId} could not be retrieved.
      </>
    );

  return <RepositoryReportPageError title={title} message={message} />;
};


const RepositoryReportPage: React.FC = () => {
  // Support both new routes: /reports/product/:productId/:cveId/:reportId and /reports/component/:cveId/:reportId
  // Also support legacy route: /reports/:productId/:cveId/:reportId
  const params = useParams<{
    productId?: string;
    cveId: string;
    reportId: string;
  }>();
  
  const { productId, cveId, reportId } = params;
  const { data: report, status, loading, error } = useRepositoryReport(reportId || "");

  if (!cveId) {
    return <RepositoryReportPageError
      title="Invalid URL format"
      message={`URL is invalid. Please use the format /reports/product/:productId/:cveId/:reportId or /reports/component/:cveId/:reportId.`}
    />;
  }

  if (loading) {
    return <RepositoryReportPageSkeleton />;
  }

  if (error) {
    return <RepositoryReportPageApiError error={error} reportId={reportId || ""} />;
  }

  if (!report) {
    return (
      <RepositoryReportPageError
        title="Report not found"
        message={`The selected report with id: ${reportId} has not been found.`}
      />
    );
  }

  const image = report.input?.image;
  // Find the vulnerability that matches the CVE ID from the route
  const vuln = report.input?.scan?.vulns?.find((v) => v.vuln_id === cveId);

  if (!vuln) {
    return (
      <RepositoryReportPageError
        title="Vulnerability not found"
        message={`The vulnerability ${cveId} was not found in the report with id: ${reportId}.`}
      />
    );
  }

  const reportIdDisplay = vuln.vuln_id
    ? `${vuln.vuln_id} | ${image?.name || ""} | ${image?.tag || ""}` : ""
  // Extract product name from metadata, fallback to productId
  const productName = report?.metadata?.product_id;
  const productCveBreadcrumbText = `${productName}/${cveId || ""}`;
  const output = report.output?.analysis || [];
  const outputVuln = output.find((v) => v.vuln_id === cveId);
  
  const showReport = () => {
    return (
      <Grid hasGutter>
        <GridItem>
          <Flex
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            <FlexItem>
              <Title headingLevel="h1">
                CVE Repository Report:{" "}
                <span
                  style={{
                    fontSize: "var(--pf-t--global--font--size--heading--h6)",
                  }}
                >
                  {reportIdDisplay}
                </span>
              </Title>
            </FlexItem>
            <FlexItem>
              <DownloadDropdown report={report} cveId={cveId} />
            </FlexItem>
          </Flex>
        </GridItem>
        <GridItem>
          <DetailsCard
            report={report}
            cveId={cveId}
            analysisState={status}
          />
        </GridItem>
        <GridItem>
          <ChecklistCard vuln={outputVuln} />
        </GridItem>
        <GridItem>
          <RepositoryAdditionalDetailsCard report={report} />
        </GridItem>
      </Grid>
    );
  };

  return (
    <>
      <PageSection>
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to="/reports">Reports</Link>
          </BreadcrumbItem>
          {productId && (
            <BreadcrumbItem>
              <Link to={`/reports/product/${productId}/${cveId}`}>
                {productCveBreadcrumbText}
              </Link>
            </BreadcrumbItem>
          )}
          <BreadcrumbItem isActive>{reportIdDisplay}</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection>{showReport()}</PageSection>
    </>
  );
};

export default RepositoryReportPage;
