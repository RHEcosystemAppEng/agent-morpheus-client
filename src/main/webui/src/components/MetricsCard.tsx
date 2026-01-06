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
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  OptimizeIcon,
  SecurityIcon,
} from "@patternfly/react-icons";

interface MetricsStatItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconStatus: "custom" | "danger" | "success" | "warning";
}

const MetricsStatItem: React.FC<MetricsStatItemProps> = ({
  label,
  value,
  icon,
  iconStatus,
}) => {
  return (
    <GridItem span={4}>
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

const MetricsCard: React.FC = () => {
  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h2" size="lg">
          Last Week Metrics
        </Title>
      </CardTitle>
      <CardBody>
        <Grid hasGutter>
          <MetricsStatItem
            label="Successfuly Analyzed Repositories"
            value={0}
            icon={<CheckCircleIcon />}
            iconStatus="success"
          />
          <MetricsStatItem
            label="Average Intel Reliability Score"
            value={0}
            icon={<OptimizeIcon />}
            iconStatus="success"
          />
          <MetricsStatItem
            label="False Positive Rate"
            value={0}
            icon={<SecurityIcon />}
            iconStatus="success"
          />
        </Grid>
      </CardBody>
      <Divider />
      <CardFooter className="pf-m-center" style={{ textAlign: 'center' }}> Based on the data from the last week. These metrics help identify false positives by tracking the percentage of analysis results that are correctly identified as not vulnerable.</CardFooter>
    </Card>
  );
};

export default MetricsCard;
