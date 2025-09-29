import { Card, CardTitle, CardBody, DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription, Label, Grid, GridItem, LabelGroup, Title } from "@patternfly/react-core";
import { formatLocalDateTime } from "../services/DateUtils";

/**
 * @param {{ product: { data: any, summary: any } }} props
 */
export default function ProductAdditionalDetails({ product }) {
  const submittedAt = product?.data?.submittedAt ?? '';
  const completedAt = product?.data?.completedAt ?? '';

  const meta = product?.data?.metadata ?? {};
  const exclude = new Set([
    'product_id',
    'product_submitted_at',
    'product_name',
    'product_version',
    'product_submitted_count'
  ]);
  const otherMetadata = Object.entries(meta)
    .filter(([k]) => !exclude.has(k))
    .map(([key, value]) => ({ key, value }));

  return (
    <Card>
      <CardTitle><Title headingLevel="h4" size="xl">Additional Details</Title></CardTitle>
      <CardBody>
        <Grid hasGutter>
          <GridItem span={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>Submitted</DescriptionListTerm>
                <DescriptionListDescription>{formatLocalDateTime(submittedAt)}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
          <GridItem span={6}>
            <DescriptionList>
              <DescriptionListGroup>
                <DescriptionListTerm>Completed</DescriptionListTerm>
                <DescriptionListDescription>{formatLocalDateTime(completedAt) || '-'}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </GridItem>
          {otherMetadata.length > 0 && (
            <GridItem span={12}>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>Metadata</DescriptionListTerm>
                  <DescriptionListDescription>
                    <LabelGroup>
                      {otherMetadata.map((m, idx) => (
                        <Label color="orange" key={`${m.key}_${idx}`}>{m.key}:{String(m.value)}</Label>
                      ))}
                    </LabelGroup>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </GridItem>
          )}
        </Grid>
      </CardBody>
    </Card>
  );
} 