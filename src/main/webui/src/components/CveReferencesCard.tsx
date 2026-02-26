import {
  List,
  ListItem,
  EmptyState,
  EmptyStateBody,
} from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";
import type { CveMetadata } from "../hooks/useCveDetails";

interface CveReferencesCardProps {
  metadata: CveMetadata | null;
}

/**
 * Component to display CVE references as a list of clickable links
 */
const CveReferencesCard: React.FC<CveReferencesCardProps> = ({ metadata }) => {
  const references = metadata?.references;

  if (!references || references.length === 0) {
    return (
      <EmptyState
        titleText="No references available"
        headingLevel="h4"
        icon={SearchIcon}
      >
        <EmptyStateBody>No references available for this CVE.</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <List>
      {references.map((reference, index) => (
        <ListItem key={index}>
          <a href={reference} target="_blank" rel="noreferrer">
            {reference}
          </a>
        </ListItem>
      ))}
    </List>
  );
};

export default CveReferencesCard;
