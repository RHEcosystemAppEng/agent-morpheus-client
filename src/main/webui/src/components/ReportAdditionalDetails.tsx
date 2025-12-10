import {
  Card,
  CardTitle,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  LabelGroup,
  Title,
} from "@patternfly/react-core";
import { ProductSummary } from "../generated-client";

interface ReportAdditionalDetailsProps {
  productSummary: ProductSummary;
}

const ReportAdditionalDetails: React.FC<ReportAdditionalDetailsProps> = ({
  productSummary,
}) => {
  const completedAt = productSummary.data.completedAt;
  const metadata = productSummary.data.metadata || {};

  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          Additional Details
        </Title>
      </CardTitle>
      <CardBody>
        <DescriptionList>
          {completedAt && (
            <DescriptionListGroup>
              <DescriptionListTerm>Completed</DescriptionListTerm>
              <DescriptionListDescription>
                {new Date(completedAt).toLocaleString()}
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {Object.keys(metadata).length > 0 && (
            <DescriptionListGroup>
              <DescriptionListTerm>Metadata</DescriptionListTerm>
              <DescriptionListDescription>
                <LabelGroup>
                  {Object.entries(metadata).map(([key, value]) => (
                    <Label key={key}>
                      {key}: {String(value)}
                    </Label>
                  ))}
                </LabelGroup>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default ReportAdditionalDetails;

