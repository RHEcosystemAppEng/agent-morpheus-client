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
import NotAvailable from "./NotAvailable";
import MetadataDisplay from "./MetadataDisplay";

interface ReportAdditionalDetailsProps {
  product: ProductSummary;
  cardHeight: string;
}

const ReportAdditionalDetails: React.FC<ReportAdditionalDetailsProps> = ({
  product,
  cardHeight,
}) => {
  const completedAt = product.data?.completedAt;
  const metadata = product.data?.metadata;

  return (
    <Card style={{ height: cardHeight, overflowY: "auto" }}>
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          Additional Details
        </Title>
      </CardTitle>
      <CardBody>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Date Completed</DescriptionListTerm>
            <DescriptionListDescription>
              {completedAt ? (
                <FormattedTimestamp date={completedAt} />
              ) : (
                <NotAvailable />
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Metadata</DescriptionListTerm>
            <DescriptionListDescription>
              <MetadataDisplay metadata={metadata} />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};

export default ReportAdditionalDetails;

