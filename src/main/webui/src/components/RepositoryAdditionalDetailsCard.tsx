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
  Title,
} from "@patternfly/react-core";
import type { FullReport } from "../types/FullReport";
import FormattedTimestamp from "./FormattedTimestamp";
import NotAvailable from "./NotAvailable";
import MetadataDisplay from "./MetadataDisplay";

interface RepositoryAdditionalDetailsCardProps {
  report: FullReport;
}

function getNonZonedTimestampValue(extracted_ts: string) {
    if (extracted_ts.endsWith("Z")) {
        extracted_ts = extracted_ts.slice(0, -1);
    }
    return extracted_ts;
}

/**
 * This function gets an object containing a timestamp, and in case it's a UTC Zoned TS, it turns it to non zoned TS
 * @param raw - Object containing ts value with a key named '$date'
 * @return extracted_ts TS string value that is not zoned.
 */
function getNonZonedTimestamp(raw: object) {
    let extracted_ts = (raw as { $date: string }).$date;
    return getNonZonedTimestampValue(extracted_ts);
}

const parseMetadataTimestamp = (
  metadata: Record<string, string> | undefined,
  key: string
): string => {
  const raw = metadata?.[key];

  // Handle MongoDB date format if present
  return raw && typeof raw === "object" && "$date" in raw
    ? getNonZonedTimestamp(raw)
    : getNonZonedTimestampValue(String(raw ?? "")) ?? "";
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
            <DescriptionListGroup>
              <DescriptionListTerm>Metadata</DescriptionListTerm>
              <DescriptionListDescription>
                <MetadataDisplay
                  metadata={report?.metadata}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
};

export default RepositoryAdditionalDetailsCard;

