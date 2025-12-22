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
import {
  calculateRepositoriesAnalyzed,
  formatRepositoriesAnalyzed,
} from "../utils/repositoriesAnalyzed";

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
  const componentStates = productSummary.summary.componentStates || {};
  const analyzedCount = calculateRepositoriesAnalyzed(componentStates);
  const repositoriesAnalyzed = formatRepositoriesAnalyzed(
    analyzedCount,
    submittedCount
  );

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
                  Number of repositories analyzed
                </DescriptionListTerm>
                <DescriptionListDescription>
                  {repositoriesAnalyzed}
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

