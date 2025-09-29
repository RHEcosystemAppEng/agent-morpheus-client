import { useState } from "react";
import { Card, CardHeader, CardTitle, CardBody, CardExpandableContent, DescriptionList, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription, Label, LabelGroup, Title } from "@patternfly/react-core";
import { formatLocalDateTime } from "../services/DateUtils";

/** @typedef {import('../types').Report} Report */

// Only keep metadata fields configurable
const METADATA_TIMESTAMP_FIELDS = [
  { label: 'Submitted', key: 'submitted_at' },
  { label: 'Sent', key: 'sent_at' }
];

/**
 * @param {{ report: Report }} props
 */
export default function AdditionalDetailsCard({ report }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const metadataFieldValues = METADATA_TIMESTAMP_FIELDS.map(def => {
    const raw = report?.metadata?.[def.key];
    const value = raw && typeof raw === 'object' && '$date' in raw ? raw.$date : (raw ?? '');
    return { label: def.label, value };
  });

  const started = report?.input?.scan?.started_at ?? '';
  const completed = report?.input?.scan?.completed_at ?? '';

  const otherMetadata = [];
  const metadataExcludeKeys = new Set(METADATA_TIMESTAMP_FIELDS.map(f => f.key));
  if (report?.metadata) {
    Object.keys(report.metadata).forEach(key => {
      if (!metadataExcludeKeys.has(key)) {
        otherMetadata.push({ key, value: report.metadata[key] });
      }
    });
  }

  const onExpand = () => setIsExpanded(prev => !prev);

  return (
    <Card isExpanded={isExpanded} id="additional-details-card">
      <CardHeader
        onExpand={onExpand}
        toggleButtonProps={{
          id: 'toggle-additional-details',
          'aria-label': 'Additional details',
          'aria-expanded': isExpanded
        }}
      >
        <CardTitle><Title headingLevel="h4" size="xl">Additional Details</Title></CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          <DescriptionList isHorizontal isCompact>
            {metadataFieldValues.map(({ label, value }) => (
              <DescriptionListGroup key={label}>
                <DescriptionListTerm>{label}</DescriptionListTerm>
                <DescriptionListDescription>{formatLocalDateTime(value)}</DescriptionListDescription>
              </DescriptionListGroup>
            ))}
            <DescriptionListGroup>
              <DescriptionListTerm>Started</DescriptionListTerm>
              <DescriptionListDescription>{formatLocalDateTime(started)}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Completed</DescriptionListTerm>
              <DescriptionListDescription>{formatLocalDateTime(completed)}</DescriptionListDescription>
            </DescriptionListGroup>
            {otherMetadata.length > 0 && (
              <DescriptionListGroup>
                <DescriptionListTerm>Metadata</DescriptionListTerm>
                <DescriptionListDescription>
                  <LabelGroup>
                    {otherMetadata.map((m, idx) => (
                      <Label key={`${m.key}_${idx}`}>{m.key}:{String(m.value)}</Label>
                    ))}
                  </LabelGroup>
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
} 