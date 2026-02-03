import {
  Card,
  CardTitle,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
} from "@patternfly/react-core";
import type { SbomReport } from "../generated-client/models/SbomReport";
import FormattedTimestamp from "./FormattedTimestamp";

interface ReportAdditionalDetailsProps {
  product: SbomReport;
}

const ReportAdditionalDetails: React.FC<ReportAdditionalDetailsProps> = ({
  product,
}) => {
  const completedAt = product.completedAt;

  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          Additional Details
        </Title>
      </CardTitle>
      <CardBody>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Completed</DescriptionListTerm>
            <DescriptionListDescription>
              {completedAt ? (
                <FormattedTimestamp date={completedAt} />
              ) : (
                "-"
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default ReportAdditionalDetails;

