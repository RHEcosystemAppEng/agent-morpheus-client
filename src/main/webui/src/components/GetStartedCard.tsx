import React, { useState } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  CardFooter,
  Grid,
  GridItem,
  Title,
  Button,
  Icon,
} from "@patternfly/react-core";
import { PlusIcon, ChartLineIcon, BookOpenIcon } from "@patternfly/react-icons";
import { useNavigate } from "react-router";
import RequestAnalysisModal from "./RequestAnalysisModal";

/**
 * GetStartedCard component - displays options to get started with ExploitIQ
 */
const GetStartedCard: React.FC = () => {
  const [isRequestAnalysisModalOpen, setIsRequestAnalysisModalOpen] =
    useState(false);
  const navigate = useNavigate();

  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h1" size="lg">
          Get started with ExploitIQ
        </Title>
        <Title
          headingLevel="h3"
          size="md"
          style={{
            fontWeight: 400,
            color: "#6a6e73",
            opacity: 1,
          }}
        >
          Analyze CVE exploitability, generate VEX status reports and track
          false positive detection metrics.
        </Title>
      </CardTitle>
      <br />
      <br />
      <CardBody>
        <Grid hasGutter>
          <GridItem span={4}>
            <Card isFullHeight isPlain>
              <CardBody>
                <div
                  style={{
                    color: "#0066cc",
                    fontSize: "18px", 
                    fontWeight: "bold",
                    marginBottom: "var(--pf-v5-global--spacer--xl)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--pf-v5-global--spacer--md)", 
                  }}
                >
                  <Icon
                    size="xl"
                  >
                    <PlusIcon style={{ color: "#0066cc" }} />
                  </Icon>
                  {"\u00A0\u00A0"}Request analysis
                </div>
                <br />
                <div style={{ fontSize: "var(--pf-v5-global--FontSize--lg)" }}>
                  Submit a new exploitability analysis request with an SBOM file
                  to analyze exploitability and generate a VEX status report.
                </div>
              </CardBody>
              <CardFooter>
                <Button
                  variant="link"
                  isInline
                  onClick={() => setIsRequestAnalysisModalOpen(true)}
                >
                  Request Analysis →
                </Button>
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card isFullHeight isPlain>
              <CardBody>
                <div
                  style={{
                    color: "#0066cc",
                    fontSize: "18px", 
                    fontWeight: "bold",
                    marginBottom: "var(--pf-v5-global--spacer--xl)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--pf-v5-global--spacer--md)", 
                  }}
                >
                  <Icon
                    size="xl"
                  >
                    <ChartLineIcon style={{ color: "#0066cc" }} />
                  </Icon>
                  {"\u00A0\u00A0"}View Reports
                </div>
                <br />
                <div style={{ fontSize: "var(--pf-v5-global--FontSize--lg)" }}>
                  Explore comprehensive product report with detailed CVE
                  analysis results, exploitability assessments, and VEX status.
                </div>
              </CardBody>
              <CardFooter>
                <Button
                  variant="link"
                  isInline
                  onClick={() => navigate("/Reports")}
                >
                  View Reports →
                </Button>
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem span={4}>
            <Card isFullHeight isPlain>
              <CardBody>
                <div
                  style={{
                    color: "#0066cc",
                    fontSize: "18px", 
                    fontWeight: "bold",
                    marginBottom: "var(--pf-v5-global--spacer--xl)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--pf-v5-global--spacer--md)", 
                  }}
                >
                  <Icon
                    size="xl"
                  >
                    <BookOpenIcon style={{ color: "#0066cc" }} />
                  </Icon>
                  {"\u00A0\u00A0"}Learn more
                </div>
                <br />
                <div style={{ fontSize: "var(--pf-v5-global--FontSize--lg)" }}>
                  Discover how ExploitIQ helps identify false positives and
                  provides accurate vulnerability exploitability assessments.
                </div>
              </CardBody>
              <CardFooter>
                <Button variant="link" isInline>
                  View Documentation →
                </Button>
              </CardFooter>
            </Card>
          </GridItem>
        </Grid>
      </CardBody>
      <RequestAnalysisModal
        isOpen={isRequestAnalysisModalOpen}
        onClose={() => setIsRequestAnalysisModalOpen(false)}
      />
    </Card>
  );
};

export default GetStartedCard;