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
  Label,
  Flex,
  FlexItem,
  Popover,
  Icon,
} from "@patternfly/react-core";
import {
  ExclamationCircleIcon,
  OutlinedQuestionCircleIcon,
} from "@patternfly/react-icons";
import { useCveDetails } from "../hooks/useCveDetails";
import CveMetadataCard from "../components/CveMetadataCard";
import CveReferencesCard from "../components/CveReferencesCard";
import CveVulnerablePackagesCard from "../components/CveVulnerablePackagesCard";
import CveDescriptionCard from "../components/CveDescriptionCard";
import CveDetailsPageSkeleton from "../components/CveDetailsPageSkeleton";

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
    return <CveDetailsPageSkeleton />;
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
            <Flex
              gap={{ default: "gapMd" }}
              alignItems={{ default: "alignItemsCenter" }}
            >
              <FlexItem>
                <Title headingLevel="h1" size="2xl">
                  <strong>{cveIdDisplay}</strong>
                </Title>
              </FlexItem>
              <FlexItem>
                <Flex
                  gap={{ default: "gapXs" }}
                  alignItems={{ default: "alignItemsCenter" }}
                >
                  <FlexItem>
                    <Label color="blue">
                      Sources: National Vulnerability Database (NVD), GitHub
                      Security Advisory (GHSA), Exploit Prediction Scoring
                      System (EPSS)
                    </Label>
                  </FlexItem>
                  <FlexItem>
                    <Popover
                      triggerAction="hover"
                      aria-label="Data sources information"
                      bodyContent={
                        <div>
                          <p>
                            This page aggregates vulnerability data from
                            multiple sources:
                          </p>
                          <p>
                            <strong>
                              National Vulnerability Database (NVD):
                            </strong>
                            <br />
                            Provides the vulnerability description.
                          </p>
                          <p>
                            <strong>GitHub Security Advisory (GHSA):</strong>
                            <br />
                            Provides CVSS score, CWE identifier, publication and
                            update dates, credits, references, and vulnerable
                            package information.
                            <br />
                            The description is used as a fallback when no NVD
                            description is available.
                          </p>
                          <p>
                            <strong>
                              Exploit Prediction Scoring System (EPSS):
                            </strong>
                            <br />
                            Provides the EPSS score, which indicates the
                            probability of exploitability.
                          </p>
                        </div>
                      }
                    >
                      <Icon
                        role="button"
                        tabIndex={0}
                        aria-label="Data sources help"
                        style={{
                          cursor: "help",
                          color: "var(--pf-v6-global--Color--200)",
                          flexShrink: 0,
                        }}
                      >
                        <OutlinedQuestionCircleIcon />
                      </Icon>
                    </Popover>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <Card
              style={{
                height: "32rem",
                overflowY: "auto",
              }}
            >
              <CardTitle>
                <Title headingLevel="h4" size="xl">
                  Description
                </Title>
              </CardTitle>
              <CardBody>
                <CveDescriptionCard metadata={metadata} />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card
              style={{
                height: "32rem",
                overflowY: "auto",
              }}
            >
              <CardTitle>
                <Title headingLevel="h4" size="xl">
                  Metadata
                </Title>
              </CardTitle>
              <CardBody>
                <CveMetadataCard metadata={metadata} />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card
              style={{
                height: "32rem",
                overflowY: "auto",
              }}
            >
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
            <Card
              style={{
                height: "32rem",
                overflowY: "auto",
              }}
            >
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
