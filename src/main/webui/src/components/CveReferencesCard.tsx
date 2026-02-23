import { List, ListItem } from "@patternfly/react-core";
import type { CveMetadata } from "../hooks/useCveDetails";
import NotAvailable from "./NotAvailable";

interface CveReferencesCardProps {
  metadata: CveMetadata | null;
}

/**
 * Component to display CVE references as a list of clickable links
 */
const CveReferencesCard: React.FC<CveReferencesCardProps> = ({ metadata }) => {
  const references = metadata?.references;

  if (!references || references.length === 0) {
    return <NotAvailable />;
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
