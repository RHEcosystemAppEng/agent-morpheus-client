import { Card, CardTitle, CardBody, Title } from "@patternfly/react-core";
import ComponentStatesPieChart from "./ComponentPieChart";

export default function RepositoryScanDistributionCard({ componentStates, submittedCount }) {
  return (
    <Card style={{ height: '100%' }}>
      <CardTitle><Title headingLevel="h4" size="xl">Repository scan distribution</Title></CardTitle>
      <CardBody>
        <ComponentStatesPieChart
          componentStates={componentStates}
          submittedCount={submittedCount}
        />
      </CardBody>
    </Card>
  );
} 