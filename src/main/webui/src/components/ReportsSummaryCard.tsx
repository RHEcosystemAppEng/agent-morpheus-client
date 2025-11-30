import React from 'react';
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
} from '@patternfly/react-core';
import { useApi } from '../hooks/useApi';
import { ReportEndpointService as Reports, ReportsSummary } from '../generated-client';
import { getErrorMessage } from '../utils/errorHandling';

interface SummaryStatItemProps {
  label: string;
  value: number;
  description: string;
}

const SummaryStatItem: React.FC<SummaryStatItemProps> = ({ label, value}) => {
  return (
    <GridItem span={3}>
      <Stack>
        <Title headingLevel="h3" size="md">
          {label}
        </Title>
        <Title headingLevel="h4" size="2xl">
          {value}
        </Title>
      </Stack>
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
          <FlexItem>
            Loading reports summary...
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

const ErrorState: React.FC<{ error: unknown }> = ({ error }) => {
  return (
    <Card>
      <CardBody>
        <Alert variant={AlertVariant.danger} title="Error loading reports summary">
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
  const { data, loading, error } = useApi<ReportsSummary>(() => Reports.getApiReportsSummary()); 

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!data) {
    return null;
  }

  const {
    vulnerableReportsCount,
    nonVulnerableReportsCount,
    pendingRequestsCount,
    newReportsTodayCount,
  } = data;

  const totalReportsCount = vulnerableReportsCount + nonVulnerableReportsCount;

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
          Reports Summary
        </Title>
      </CardTitle>
      <CardBody>
        <Grid hasGutter>
          <SummaryStatItem
            label="Total Reports"
            value={totalReportsCount}
            description="Total completed reports"
          />
          <SummaryStatItem
            label="Vulnerable Reports"
            value={vulnerableReportsCount}
            description="Reports with vulnerable CVEs"
          />
          <SummaryStatItem
            label="Non-Vulnerable Reports"
            value={nonVulnerableReportsCount}
            description="Reports with only non-vulnerable CVEs"
          />
          <SummaryStatItem
            label="Pending Requests"
            value={pendingRequestsCount}
            description="Analysis requests pending"
          />
          <SummaryStatItem
            label="New Reports Today"
            value={newReportsTodayCount}
            description="Reports submitted today"
          />
        </Grid>
      </CardBody>
    </Card>
  );
};

export default ReportsSummaryCard;

