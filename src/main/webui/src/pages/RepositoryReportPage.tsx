import { useParams, Link } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Title,
  Grid,
  GridItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { useApi } from "../hooks/useApi";
import { getErrorMessage } from "../utils/errorHandling";
import { getRepositoryReport } from "../utils/reportApi";
import DetailsCard from "../components/DetailsCard";
import ChecklistCard from "../components/ChecklistCard";
import RepositoryAdditionalDetailsCard from "../components/RepositoryAdditionalDetailsCard";
import type { FullReport } from "../types/FullReport";
import RepositoryReportPageSkeleton from "../components/RepositoryReportPageSkeleton";


const RepositoryReportPage: React.FC = () => {
  const { productId, cveId, reportId } = useParams<{
    productId: string;
    cveId: string;
    reportId: string;
  }>();
  

  const { data: report, loading, error } = useApi<FullReport>(
    () => getRepositoryReport(reportId || ""),
    { deps: [reportId] }
  );

  const image = report?.input?.image;
  const output = report?.output || [];
  // Find the vulnerability that matches the CVE ID from the route
  const vuln =
    output.find((v) => v.vuln_id === cveId) || output[0];
  const reportIdDisplay = vuln?.vuln_id
    ? `${vuln.vuln_id} | ${image?.name || ""} | ${image?.tag || ""}`
    : reportId || "";

  // Extract product name from metadata, fallback to productId
  const productName = report?.metadata?.product_name || productId || "";
  const productCveBreadcrumbText = `${productName}/${cveId || ""}`;

  const showReport = () => {
    if (error) {
      const errorStatus = (error as { status?: number })?.status;
      if (errorStatus === 404) {
        return (
          <EmptyState
            headingLevel="h4"
            icon={CubesIcon}
            titleText="Report not found"
          >
            <EmptyStateBody>
              The selected report with id: {reportId} has not been found. 
            </EmptyStateBody>
          </EmptyState>
        );
      } else {
        return (
          <EmptyState
            headingLevel="h4"
            icon={ExclamationCircleIcon}
            titleText="Could not retrieve the selected report"
          >
            <EmptyStateBody>
              <p>
                {errorStatus || "Error"}: {getErrorMessage(error)}
              </p>
              The selected report with id: {reportId} could not be retrieved.
            </EmptyStateBody>
          </EmptyState>
        );
      }
    }


    if (loading || !report) {
      return <RepositoryReportPageSkeleton />;
    }

    return (
      <Grid hasGutter>
        <GridItem>
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
        </GridItem>
        <GridItem>
          <DetailsCard report={report} cveId={cveId} />
        </GridItem>
        <GridItem>
          <ChecklistCard vuln={vuln} />
        </GridItem>
        <GridItem>
          <RepositoryAdditionalDetailsCard report={report} />
        </GridItem>
      </Grid>
    );
  };

  return (
    <PageSection>
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/Reports">Reports</Link>
        </BreadcrumbItem>
        {productId && cveId && (
          <BreadcrumbItem>
            <Link to={`/Reports/${productId}/${cveId}`}>
              {productCveBreadcrumbText}
            </Link>
          </BreadcrumbItem>
        )}
        <BreadcrumbItem isActive>{reportIdDisplay}</BreadcrumbItem>
      </Breadcrumb>
      {showReport()}
    </PageSection>
  );
};

export default RepositoryReportPage;
