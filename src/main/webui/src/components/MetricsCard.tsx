import React from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Grid,
  GridItem,
  Title,
  Stack,
  Flex,
  FlexItem,
  Icon,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  OptimizeIcon,
  TrendDownIcon,
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
          False Positive Detection Metrics
        </Title>
      </CardTitle>
      <CardBody>
        <Grid hasGutter>
          <MetricsStatItem
            label="Placeholder Label 1"
            value={0}
            icon={<CheckCircleIcon />}
            iconStatus="success"
          />
          <MetricsStatItem
            label="Placeholder Label 2"
            value={0}
            icon={<TrendDownIcon />}
            iconStatus="success"
          />
          <MetricsStatItem
            label="Placeholder Label 3"
            value={0}
            icon={<OptimizeIcon />}
            iconStatus="success"
          />
        </Grid>
      </CardBody>
    </Card>
  );
};

export default MetricsCard;
