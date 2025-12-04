import React from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Title,
  Spinner,
  Alert,
  AlertVariant,
  Stack,
  Flex,
  FlexItem,
  Icon,
} from "@patternfly/react-core";
import { useSummary } from "../hooks/useSummary";
import { getErrorMessage } from "../utils/errorHandling";
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InProgressIcon,
} from "@patternfly/react-icons";

interface SummaryStatItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconStatus: "custom" | "danger" | "success" | "warning";
}

const SummaryStatItem: React.FC<SummaryStatItemProps> = ({
  label,
  value,
  icon,
  iconStatus,
}) => {
  return (
    <GridItem span={3}>
      <Card ouiaId="BasicCard">
        <CardBody>
          <Stack style={{ textAlign: "center" }}>
            <FlexItem>
              <Icon status={iconStatus} size="xl">
                {icon}
              </Icon>
            </FlexItem>
            <FlexItem>
              <Title headingLevel="h2" size="3xl">
                {value}
              </Title>
            </FlexItem>
            <FlexItem>{label}</FlexItem>
          </Stack>
        </CardBody>
      </Card>
    </GridItem>
  );
};

const LoadingState: React.FC = () => {
  return (
    <Card>
      <CardBody>
        <Flex>
          <FlexItem>
            <Spinner size="lg" />
          </FlexItem>
          <FlexItem>Loading reports summary...</FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

const ErrorState: React.FC<{ error: unknown }> = ({ error }) => {
  return (
    <Card>
      <CardBody>
        <Alert
          variant={AlertVariant.danger}
          title="Error loading reports summary"
        >
          {getErrorMessage(error)}
        </Alert>
      </CardBody>
    </Card>
  );
};

const EmptyState: React.FC = () => {
  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h2" size="lg">
          Reports Summary
        </Title>
      </CardTitle>
      <CardBody>
        No reports available. Start by requesting an analysis.
      </CardBody>
    </Card>
  );
};

const ReportsSummaryCard: React.FC = () => {
  // Fetch reports and calculate summary
  const { summary, loading, error, reports } = useSummary();

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!reports || reports.length === 0) {
    return <EmptyState />;
  }

  const {
    vulnerableReportsCount,
    nonVulnerableReportsCount,
    pendingRequestsCount,
    newReportsTodayCount,
  } = summary;

  const allZero =
    vulnerableReportsCount === 0 &&
    nonVulnerableReportsCount === 0 &&
    pendingRequestsCount === 0 &&
    newReportsTodayCount === 0;

  if (allZero) {
    return <EmptyState />;
  }

  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h2" size="lg">
          Current Status
        </Title>
      </CardTitle>
      <CardBody>
        <Grid hasGutter>
          <SummaryStatItem
            label="New Reports Today"
            value={newReportsTodayCount}
            icon={<BellIcon />}
            iconStatus="custom"
          />
          <SummaryStatItem
            label="Vulnerable Reports"
            value={vulnerableReportsCount}
            icon={<ExclamationTriangleIcon />}
            iconStatus="danger"
          />
          <SummaryStatItem
            label="Not Vulnerable Reports"
            value={nonVulnerableReportsCount}
            icon={<CheckCircleIcon />}
            iconStatus="success"
          />
          <SummaryStatItem
            label="Pending Requests"
            value={pendingRequestsCount}
            icon={<InProgressIcon />}
            iconStatus="warning"
          />
        </Grid>
      </CardBody>
    </Card>
  );
};

export default ReportsSummaryCard;
