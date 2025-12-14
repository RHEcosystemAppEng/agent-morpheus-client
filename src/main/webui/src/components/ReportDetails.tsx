import {
  Card,
  CardTitle,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Grid,
  GridItem,
  Title,
} from "@patternfly/react-core";
import { ProductSummary } from "../generated-client";

interface ReportDetailsProps {
  productSummary: ProductSummary;
  cveId: string;
}

const ReportDetails: React.FC<ReportDetailsProps> = ({
  productSummary,
  cveId,
}) => {
  const name = productSummary.data.name || "";
  const submittedCount = productSummary.data.submittedCount || 0;
  const scannedCount =
    submittedCount - (productSummary.data.submissionFailures?.length || 0);

  return (
    <Card>
      <CardTitle>
        <Title headingLevel="h4" size="xl">
          Report Details
        </Title>
      </CardTitle>
      <CardBody>
        <Grid hasGutter>
          <GridItem span={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>CVE Analyzed</DescriptionListTerm>
                <DescriptionListDescription>{cveId}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Report name</DescriptionListTerm>
                <DescriptionListDescription>{name}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
          <GridItem span={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>
                  Number of repositories scanned
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {scannedCount} / {submittedCount}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default ReportDetails;

