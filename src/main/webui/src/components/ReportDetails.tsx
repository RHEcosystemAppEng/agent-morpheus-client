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
import type { SbomReport } from "../generated-client/models/SbomReport";

interface ReportDetailsProps {
  product: SbomReport;
  cveId: string;
}

const ReportDetails: React.FC<ReportDetailsProps> = ({
  product,
  cveId,
}) => {
  const name = product.sbomName || "";
  const repositoriesAnalyzed = product.statusCounts["completed"]?.toString() || "0";

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

