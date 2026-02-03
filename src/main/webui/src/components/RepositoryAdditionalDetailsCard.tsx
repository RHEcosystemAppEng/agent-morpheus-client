import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardExpandableContent,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  LabelGroup,
  Title,
} from "@patternfly/react-core";
import type { FullReport } from "../types/FullReport";
import FormattedTimestamp from "./FormattedTimestamp";
import NotAvailable from "./NotAvailable";

interface RepositoryAdditionalDetailsCardProps {
  report: FullReport;
}

// Only keep metadata fields configurable
const METADATA_TIMESTAMP_FIELDS = [
  { label: "Submitted", key: "submitted_at" },
  { label: "Sent", key: "sent_at" },
];

const parseMetadataTimestamp = (
  metadata: Record<string, string> | undefined,
  key: string
): string => {
  const raw = metadata?.[key];
  // Handle MongoDB date format if present
  return raw && typeof raw === "object" && "$date" in raw
    ? (raw as { $date: string }).$date
    : raw ?? "";
};

const RepositoryAdditionalDetailsCard: React.FC<RepositoryAdditionalDetailsCardProps> = ({
  report,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const firstVuln = report?.output?.analysis?.[0] || {};
  const cvssVector = firstVuln?.cvss?.vector_string ?? "";

  const submittedAt = parseMetadataTimestamp(report?.metadata, "submitted_at");
  const sentAt = parseMetadataTimestamp(report?.metadata, "sent_at");
  
  const started = report?.input?.scan?.started_at ?? "";
  const completed = report?.input?.scan?.completed_at ?? "";

  const otherMetadata: Array<{ key: string; value: string }> = [];
  const metadataExcludeKeys = new Set(
    METADATA_TIMESTAMP_FIELDS.map((f) => f.key)
  );
  if (report?.metadata) {
    Object.keys(report.metadata).forEach((key) => {
      if (!metadataExcludeKeys.has(key)) {
        otherMetadata.push({
          key,
          value: String(report.metadata![key]),
        });
      }
    });
  }

  const onExpand = () => setIsExpanded((prev) => !prev);

  return (
    <Card isExpanded={isExpanded} id="additional-details-card">
      <CardHeader
        onExpand={onExpand}
        toggleButtonProps={{
          id: "toggle-additional-details",
          "aria-label": "Additional details",
          "aria-expanded": isExpanded,
        }}
      >
        <CardTitle>
          <Title headingLevel="h4" size="xl">
            Additional Details
          </Title>
        </CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          <DescriptionList isHorizontal isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>CVSS Vector String</DescriptionListTerm>
              <DescriptionListDescription>
                {cvssVector || <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Submitted</DescriptionListTerm>
              <DescriptionListDescription>
                {submittedAt ? <FormattedTimestamp date={submittedAt} /> : <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Sent</DescriptionListTerm>
              <DescriptionListDescription>
                {sentAt ? <FormattedTimestamp date={sentAt} /> : <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Started</DescriptionListTerm>
              <DescriptionListDescription>
                {started ? <FormattedTimestamp date={started} /> : <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Completed</DescriptionListTerm>
              <DescriptionListDescription>
                {completed ? <FormattedTimestamp date={completed} /> : <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {otherMetadata.length > 0 ? (
              <DescriptionListGroup>
                <DescriptionListTerm>Metadata</DescriptionListTerm>
                <DescriptionListDescription>
                  <LabelGroup >
                    {otherMetadata.map((m, idx) => (
                      <Label key={`${m.key}_${idx}`}>
                        {m.key}:{String(m.value)}
                      </Label>
                    ))}
                  </LabelGroup>
                </DescriptionListDescription>
              </DescriptionListGroup>
            ) : <NotAvailable />}
          </DescriptionList>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
};

export default RepositoryAdditionalDetailsCard;

