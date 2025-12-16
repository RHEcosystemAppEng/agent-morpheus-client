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
import FormattedTimestamp from "./FormattedTimestamp";

interface ReportAdditionalDetailsProps {
  productSummary: ProductSummary;
}

const ReportAdditionalDetails: React.FC<ReportAdditionalDetailsProps> = ({
  productSummary,
}) => {
  const completedAt = productSummary.data.completedAt;
  const metadata = productSummary.data.metadata || {};

  // Filter out internal metadata fields
  const filteredMetadata = Object.fromEntries(
    Object.entries(metadata).filter(
      ([key]) =>
        key !== "product_id" &&
        key !== "product_name" &&
        key !== "product_submitted_count"
    )
  );

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
          {Object.keys(filteredMetadata).length > 0 && (
            <DescriptionListGroup>
              <DescriptionListTerm>Metadata</DescriptionListTerm>
              <DescriptionListDescription>
                <LabelGroup>
                  {Object.entries(filteredMetadata).map(([key, value]) => (
                    <Label key={key} color="orange">
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

