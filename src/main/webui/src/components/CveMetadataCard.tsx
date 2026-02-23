import {
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import type { CveMetadata } from "../hooks/useCveDetails";
import { getCvssSeverityIconAndColor } from "./CvssBanner";
import FormattedTimestamp from "./FormattedTimestamp";
import NotAvailable from "./NotAvailable";

interface CveMetadataCardProps {
  metadata: CveMetadata | null;
}

/**
 * Component to display CVE metadata in a DescriptionList format
 */
const CveMetadataCard: React.FC<CveMetadataCardProps> = ({ metadata }) => {
  // Format CVSS score with icon using shared utility from CvssBanner
  // Uses PatternFly CSS variables for icon colors
  const cvssDisplay =
    metadata?.cvssScore !== undefined
      ? (() => {
          const { severity, Icon, color } = getCvssSeverityIconAndColor(
            metadata.cvssScore
          );
          return (
            <Flex spaceItems={{ default: "spaceItemsXs" }}>
              {Icon && (
                <FlexItem>
                  <Icon color={color} />
                </FlexItem>
              )}
              <FlexItem>
                <span>
                  {severity} ({metadata.cvssScore})
                </span>
              </FlexItem>
            </Flex>
          );
        })()
      : null;

  // Format EPSS score (multiply by 100 and add %)
  const epssDisplay =
    metadata?.epssPercentage !== undefined
      ? `${(metadata.epssPercentage * 100).toFixed(3)}%`
      : null;

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>CVSS Score</DescriptionListTerm>
        <DescriptionListDescription>
          {cvssDisplay || <NotAvailable />}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>EPSS Score</DescriptionListTerm>
        <DescriptionListDescription>
          {epssDisplay || <NotAvailable />}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>CWE</DescriptionListTerm>
        <DescriptionListDescription>
          {metadata?.cwe || <NotAvailable />}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Published</DescriptionListTerm>
        <DescriptionListDescription>
          {metadata?.publishedAt ? (
            <FormattedTimestamp date={metadata.publishedAt} />
          ) : (
            <NotAvailable />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Updated</DescriptionListTerm>
        <DescriptionListDescription>
          {metadata?.updatedAt ? (
            <FormattedTimestamp date={metadata.updatedAt} />
          ) : (
            <NotAvailable />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Credits</DescriptionListTerm>
        <DescriptionListDescription>
          {metadata?.credits ? (
            <a href={metadata.credits.htmlUrl} target="_blank" rel="noreferrer">
              {metadata.credits.login}
            </a>
          ) : (
            <NotAvailable />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default CveMetadataCard;
