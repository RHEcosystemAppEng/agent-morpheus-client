import { useParams, Link } from "react-router";
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
import { useCveDetails } from "../hooks/useCveDetails";
import CveMetadataCard from "../components/CveMetadataCard";
import CveReferencesCard from "../components/CveReferencesCard";
import CveVulnerablePackagesCard from "../components/CveVulnerablePackagesCard";
import CveDescriptionCard from "../components/CveDescriptionCard";
import SkeletonCard from "../components/SkeletonCard";

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
  const params = useParams<{
    productId?: string;
    cveId: string;
    reportId?: string;
  }>();
  const { productId, cveId, reportId } = params;

  if (!cveId) {
    return (
      <CveDetailsPageError
        title="Invalid CVE"
        message="CVE ID is missing from the URL."
      />
    );
  }

  const cveIdDisplay = cveId.toUpperCase();
  const isComponentRoute = !productId;

  const buildBreadcrumb = () => {
    return (
      <Breadcrumb>
        <BreadcrumbItem>
          <Link to="/reports">Reports</Link>
        </BreadcrumbItem>
        {productId && (
          <BreadcrumbItem>
            <Link to={`/reports/product/${productId}/${cveId}`}>
              {productId}/{cveId}
            </Link>
          </BreadcrumbItem>
        )}
        {reportId && (
          <BreadcrumbItem>
            <Link
              to={
                isComponentRoute
                  ? `/reports/component/${cveId}/${reportId}`
                  : `/reports/product/${productId}/${cveId}/${reportId}`
              }
            >
              Report {reportId.substring(0, 8)}...
            </Link>
          </BreadcrumbItem>
        )}
        <BreadcrumbItem isActive>CVE Details</BreadcrumbItem>
      </Breadcrumb>
    );
  };

  const { metadata, loading, error } = useCveDetails(cveId, reportId);

  if (loading) {
    return (
      <>
        <PageSection>
          <Grid hasGutter>
            <GridItem>{buildBreadcrumb()}</GridItem>
            <GridItem>
              <Title headingLevel="h1" size="2xl">
                <strong>{cveIdDisplay}</strong>
              </Title>
            </GridItem>
          </Grid>
        </PageSection>
        <PageSection>
          <Grid hasGutter>
            <GridItem span={6}>
              <SkeletonCard
                lines={3}
                widths={["40%", "60%", "45%"]}
                screenreaderText="Loading details card"
              />
            </GridItem>
            <GridItem span={6}>
              <SkeletonCard
                lines={6}
                widths={["35%", "50%", "45%", "40%", "45%", "50%"]}
                screenreaderText="Loading metadata card"
              />
            </GridItem>
            <GridItem span={6}>
              <SkeletonCard
                lines={3}
                widths={["50%", "65%", "55%"]}
                screenreaderText="Loading vulnerable packages card"
              />
            </GridItem>
            <GridItem span={6}>
              <SkeletonCard
                lines={3}
                widths={["45%", "60%", "50%"]}
                screenreaderText="Loading references card"
              />
            </GridItem>
          </Grid>
        </PageSection>
      </>
    );
  }

  if (error) {
    return (
      <CveDetailsPageError
        title="Error loading CVE details"
        message={
          error.message || "An error occurred while loading CVE details."
        }
      />
    );
  }

  return (
    <>
      <PageSection>
        <Grid hasGutter>
          <GridItem>{buildBreadcrumb()}</GridItem>
          <GridItem>
            <Title headingLevel="h1" size="2xl">
              <strong>{cveIdDisplay}</strong>
            </Title>
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardTitle>
                <Title headingLevel="h4" size="xl">
                  Description
                </Title>
              </CardTitle>
              <CardBody style={{ flex: 1 }}>
                <CveDescriptionCard metadata={metadata} />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardTitle>
                <Title headingLevel="h4" size="xl">
                  Metadata
                </Title>
              </CardTitle>
              <CardBody style={{ flex: 1 }}>
                <CveMetadataCard metadata={metadata} />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h4" size="xl">
                  Vulnerable Packages
                </Title>
              </CardTitle>
              <CardBody>
                <CveVulnerablePackagesCard metadata={metadata} />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card>
              <CardTitle>
                <Title headingLevel="h4" size="xl">
                  References
                </Title>
              </CardTitle>
              <CardBody>
                <CveReferencesCard metadata={metadata} />
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

export default CveDetailsPage;
