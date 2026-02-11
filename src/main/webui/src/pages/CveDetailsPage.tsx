import { useParams, Link, useLocation } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Title,
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  EmptyState,
  EmptyStateBody,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import CveDetailsPageSkeleton from "../components/CveDetailsPageSkeleton";

interface BreadcrumbContext {
  sbomReportId?: string;
  sbomName?: string;
  reportId?: string;
  reportIdDisplay?: string;
  isComponentRoute?: boolean;
}

interface CveDetailsPageErrorProps {
  title: string;
  message: string | React.ReactNode;
}

const CveDetailsPageError: React.FC<CveDetailsPageErrorProps> = ({
  title,
  message,
}) => {
  return (
    <PageSection>
      <EmptyState
        headingLevel="h4"
        icon={ExclamationCircleIcon}
        titleText={title}
      >
        <EmptyStateBody>{message}</EmptyStateBody>
      </EmptyState>
    </PageSection>
  );
};

const CveDetailsPage: React.FC = () => {
  const { cveId } = useParams<{ cveId: string }>();
  const location = useLocation();
  const breadcrumbContext = (location.state as BreadcrumbContext) || {};

  if (!cveId) {
    return (
      <CveDetailsPageError
        title="Invalid CVE"
        message="CVE ID is missing from the URL."
      />
    );
  }

  const cveIdDisplay = cveId.toUpperCase();
  const {
    sbomReportId,
    sbomName,
    reportId,
    reportIdDisplay,
    isComponentRoute,
  } = breadcrumbContext;

  const buildBreadcrumb = () => {
    // Only show full breadcrumb path if coming from repository report page (has breadcrumb context)
    const hasBreadcrumbContext =
      (sbomReportId || reportId) && (sbomName || reportIdDisplay);

    return (
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/reports">Reports</Link>
        </BreadcrumbItem>
        {hasBreadcrumbContext && (
          <>
            {sbomReportId && sbomName && !isComponentRoute && (
              <BreadcrumbItem>
                <Link to={`/reports/sbom-report/${sbomReportId}/${cveId}`}>
                  {`${sbomName}/${cveId}`}
                </Link>
              </BreadcrumbItem>
            )}
            {reportId && reportIdDisplay && (
              <BreadcrumbItem>
                <Link
                  to={
                    isComponentRoute
                      ? `/reports/component/${cveId}/${reportId}`
                      : `/reports/sbom-report/${sbomReportId}/${cveId}/${reportId}`
                  }
                >
                  {reportIdDisplay}
                </Link>
              </BreadcrumbItem>
            )}
          </>
        )}
        <BreadcrumbItem isActive>CVE Details</BreadcrumbItem>
      </Breadcrumb>
    );
  };

  // TODO: Add data fetching hook when API is implemented
  // const { data, loading, error } = useCveDetails(cveId);
  // if (loading) {
  //   return <CveDetailsPageSkeleton />;
  // }

  return (
    <>
      <PageSection>
        <Grid hasGutter>
          <GridItem>{buildBreadcrumb()}</GridItem>
          <GridItem>
            <Title headingLevel="h1" size="3xl">
              <strong>{cveIdDisplay}</strong>
            </Title>
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h4" size="xl">
                  Details
                </Title>
              </CardTitle>
              <CardBody>{/* Placeholder for future implementation */}</CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h4" size="xl">
                  Metadata
                </Title>
              </CardTitle>
              <CardBody>{/* Placeholder for future implementation */}</CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h4" size="xl">
                  Vulnerable Packages
                </Title>
              </CardTitle>
              <CardBody>{/* Placeholder for future implementation */}</CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h4" size="xl">
                  References
                </Title>
              </CardTitle>
              <CardBody>{/* Placeholder for future implementation */}</CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

export default CveDetailsPage;
