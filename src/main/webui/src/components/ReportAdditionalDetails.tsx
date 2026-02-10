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
import type { ProductSummary } from "../generated-client/models/ProductSummary";
import FormattedTimestamp from "./FormattedTimestamp";

interface ReportAdditionalDetailsProps {
  product: ProductSummary;
}

const ReportAdditionalDetails: React.FC<ReportAdditionalDetailsProps> = ({
  product,
}) => {
  const completedAt = product.data?.completedAt;

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

