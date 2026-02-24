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
import { Link, useParams } from "react-router";
import type { ProductSummary } from "../generated-client/models/ProductSummary";

interface ReportDetailsProps {
  product: ProductSummary;
  cveId: string;
}

const ReportDetails: React.FC<ReportDetailsProps> = ({ product, cveId }) => {
  const name = product.data?.name || "";
  const repositoriesAnalyzed =
    product.summary?.statusCounts?.["completed"]?.toString() || "0";
  const params = useParams<{ productId?: string }>();
  const { productId } = params;

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
                <DescriptionListDescription>
                  {productId ? (
                    <Link to={`/reports/product/cve/${productId}/${cveId}`}>
                      {cveId}
                    </Link>
                  ) : (
                    cveId
                  )}
                </DescriptionListDescription>
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
