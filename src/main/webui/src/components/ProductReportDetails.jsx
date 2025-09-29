import { Card, CardTitle, CardBody, DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription, Grid, GridItem, Title } from "@patternfly/react-core";
import { Link } from "react-router-dom";

/**
 * @param {Object} props
 * @param {import('../types.js').Product} props.product
 */
export default function ProductReportDetails({ product }) {
  const name = product?.data?.name ?? "";
  const version = product?.data?.version ?? "";
  const submittedCount = product?.data?.submittedCount ?? 0;
  const firstCve = Object.keys(product?.summary?.cves ?? {})[0];
  const scannedCount = submittedCount - (product?.data?.submissionFailures?.length ?? 0);
  return (
    <Card>
      <CardTitle><Title headingLevel="h4" size="xl">Product report details</Title></CardTitle>
      <CardBody>
        <Grid hasGutter>
          <GridItem span={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>CVE Analyzed</DescriptionListTerm>
                <DescriptionListDescription>
                  {firstCve ? (
                    <Link to={`/reports?vulnId=${firstCve}`}>{firstCve}</Link>
                  ) : (
                    <span>-</span>
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Product name</DescriptionListTerm>
                <DescriptionListDescription>{name}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
          <GridItem span={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>Number of repositories scanned</DescriptionListTerm>
                <DescriptionListDescription>{scannedCount} / {submittedCount}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Version</DescriptionListTerm>
                <DescriptionListDescription>{version}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
} 