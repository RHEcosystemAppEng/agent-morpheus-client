import React from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Title,
  Stack,
  FlexItem,
  Icon,
  Divider,
  CardFooter,
  Skeleton,
  Alert,
  AlertVariant,
  Bullseye,
  EmptyState,
  EmptyStateVariant,
  EmptyStateBody,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  SecurityIcon,
  SearchIcon,
} from "@patternfly/react-icons";
import { useApi } from "../hooks/useApi";
import { OverviewMetricsService, OverviewMetrics } from "../generated-client";

interface MetricsStatItemProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconStatus: "custom" | "danger" | "success" | "warning";
  loading?: boolean;
  iconColor?: string;
}

const MetricsStatItem: React.FC<MetricsStatItemProps> = ({
  label,
  value,
  icon,
  iconStatus,
  loading = false,
  iconColor,
}) => {
  return (
    <GridItem span={4}>
      <Card ouiaId="BasicCard">
        <CardBody>
          <Stack style={{ textAlign: "center" }}>
            <FlexItem>
              <Icon
                status={iconStatus}
                size="xl"
                style={iconColor ? { color: iconColor } : undefined}
              >
                {icon}
              </Icon>
            </FlexItem>
            <FlexItem>
              {loading ? (
                <Skeleton
                  width="60%"
                  height="2.5rem"
                  screenreaderText="Loading metric value"
                />
              ) : (
                <Title headingLevel="h2" size="3xl">
                  {value}
                </Title>
              )}
            </FlexItem>
            <FlexItem>{label}</FlexItem>
          </Stack>
        </CardBody>
      </Card>
    </GridItem>
  );
};

const MetricsCard: React.FC = () => {
  const {
    data: metrics,
    loading,
    error,
  } = useApi<OverviewMetrics>(() =>
    OverviewMetricsService.getApiV1OverviewMetrics()
  );

  // Format percentage values with 1 decimal place
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Format count as whole number
  const formatCount = (value: number): string => {
    return Math.round(value).toString();
  };

  // Format average score with 1 decimal place
  const formatScore = (value: number): string => {
    return value.toFixed(1);
  };

  const successfullyAnalyzed = metrics?.successfullyAnalyzed ?? 0;
  const averageReliabilityScore = metrics?.averageReliabilityScore ?? 0;
  const falsePositiveRate = metrics?.falsePositiveRate ?? 0;

  // Check if there's no data
  const hasNoData = successfullyAnalyzed === 0;
  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h2" size="lg">
          Last Week Metrics
        </Title>
      </CardTitle>
      <CardBody>
        {error ? (
          <Alert variant={AlertVariant.danger} title="Error loading metrics">
            {error.message || "Failed to load metrics. Please try again later."}
          </Alert>
        ) : hasNoData ? (
          <Bullseye>
            <EmptyState
              titleText="No data available"
              icon={SearchIcon}
              headingLevel="h2"
              variant={EmptyStateVariant.sm}
            >
              <EmptyStateBody>
                No metrics data available for the last 7 days.
              </EmptyStateBody>
            </EmptyState>
          </Bullseye>
        ) : (
          <Grid hasGutter>
            <MetricsStatItem
              label="Successfully Analyzed"
              value={loading ? "" : formatCount(successfullyAnalyzed)}
              icon={<CheckCircleIcon />}
              iconStatus="success"
              loading={loading}
            />
            <MetricsStatItem
              label="Average Intel Reliability Score"
              value={loading ? "" : formatScore(averageReliabilityScore)}
              icon={
                <img
                  src="/AI Icon.svg"
                  style={{ height: "1.5rem", width: "1.5rem" }}
                />
              }
              iconStatus="custom"
              iconColor="var(--pf-t--global--color--brand--default)"
              loading={loading}
            />
            <MetricsStatItem
              label="False Positive Rate"
              value={loading ? "" : formatPercentage(falsePositiveRate)}
              icon={<SecurityIcon />}
              iconStatus="success"
              loading={loading}
            />
          </Grid>
        )}
      </CardBody>
      <Divider />
      <CardFooter className="pf-m-center" style={{ textAlign: "center" }}>
        {" "}
        Based on the data from the last week. These metrics help identify false
        positives by tracking the percentage of analysis results that are
        correctly identified as not vulnerable.
      </CardFooter>
    </Card>
  );
};

export default MetricsCard;
