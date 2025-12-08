import React, { useState } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Title,
  Stack,
  StackItem,
  Button,
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
        <Grid
          hasGutter
          style={{ marginTop: "calc(var(--pf-v5-global--spacer--lg) * 2)" }}
        >
          <GridItem
            span={4}
            style={{
              borderRight: "1px solid #d2d2d2",
              paddingRight: "var(--pf-v5-global--spacer--lg)",
            }}
          >
            <Stack hasGutter>
              <StackItem>
                <div
                  style={{
                    transform: "scale(2)",
                    transformOrigin: "0 0",
                    display: "block",
                    color: "#0066cc",
                    width: "fit-content",
                    marginBottom: "var(--pf-v5-global--spacer--md)",
                  }}
                >
                  <PlusIcon style={{ color: "#0066cc" }} />
                </div>
              </StackItem>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  Request analysis
                </Title>
                <br />
                <Title
                  headingLevel="h3"
                  size="md"
                  style={{
                    fontWeight: 400,
                    color: "#6a6e73",
                    opacity: 1,
                  }}
                >
                  Submit a new exploitability analysis request with an SBOM file
                  to analyze exploitability and generate a VEX status report.
                </Title>
                <br />
              </StackItem>
              <StackItem>
                <Button
                  variant="secondary"
                  onClick={() => setIsRequestAnalysisModalOpen(true)}
                >
                  Request Analysis →
                </Button>
              </StackItem>
            </Stack>
          </GridItem>
          <GridItem
            span={4}
            style={{
              borderRight: "1px solid #d2d2d2",
              paddingRight: "var(--pf-v5-global--spacer--lg)",
            }}
          >
            <Stack hasGutter>
              <StackItem>
                <div
                  style={{
                    transform: "scale(2)",
                    transformOrigin: "0 0",
                    display: "block",
                    color: "#0066cc",
                    width: "fit-content",
                    marginBottom: "var(--pf-v5-global--spacer--md)",
                  }}
                >
                  <ChartLineIcon style={{ color: "#0066cc" }} />
                </div>
              </StackItem>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  View Reports
                </Title>
                <br />
                <Title
                  headingLevel="h3"
                  size="md"
                  style={{
                    fontWeight: 400,
                    color: "#6a6e73",
                    opacity: 1,
                  }}
                >
                  Explore comprehensive product report with detailed CVE
                  analysis results, exploitability assessments, and VEX status.
                </Title>
                <br />
              </StackItem>
              <StackItem>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/Reports")}
                >
                  View Reports →
                </Button>
              </StackItem>
            </Stack>
          </GridItem>
          <GridItem span={4}>
            <Stack hasGutter>
              <StackItem>
                <div
                  style={{
                    transform: "scale(2)",
                    transformOrigin: "0 0",
                    display: "block",
                    color: "#0066cc",
                    width: "fit-content",
                    marginBottom: "var(--pf-v5-global--spacer--md)",
                  }}
                >
                  <BookOpenIcon style={{ color: "#0066cc" }} />
                </div>
              </StackItem>
              <StackItem>
                <Title headingLevel="h3" size="lg">
                  Learn more
                </Title>
                <br />
                <Title
                  headingLevel="h3"
                  size="md"
                  style={{
                    fontWeight: 400,
                    color: "#6a6e73",
                    opacity: 1,
                  }}
                >
                  Discover how ExploitIQ helps identify false positives and
                  provides accurate vulnerability exploitability assessments.
                </Title>
                <br />
              </StackItem>
              <StackItem>
                <Button variant="secondary">View Documentation →</Button>
              </StackItem>
            </Stack>
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
