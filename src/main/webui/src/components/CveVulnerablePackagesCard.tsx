import {
  List,
  ListItem,
  Title,
  EmptyState,
  EmptyStateBody,
} from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";
import type { CveMetadata } from "../hooks/useCveDetails";

interface CveVulnerablePackagesCardProps {
  metadata: CveMetadata | null;
}

/**
 * Component to display CVE vulnerable packages with their details
 */
const CveVulnerablePackagesCard: React.FC<CveVulnerablePackagesCardProps> = ({
  metadata,
}) => {
  const vulnerablePackages = metadata?.vulnerablePackages;

  if (!vulnerablePackages || vulnerablePackages.length === 0) {
    return (
      <EmptyState
        titleText="No vulnerable packages available"
        headingLevel="h4"
        icon={SearchIcon}
      >
        <EmptyStateBody>
          No vulnerable packages available for this CVE.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <List isPlain={true}>
      {vulnerablePackages.map((pkg, index) => (
        <ListItem key={index}>
          <Title headingLevel="h5" size="md" style={{ marginBottom: "0.5rem" }}>
            <strong>{pkg.name}</strong>
          </Title>
          <div>Ecosystem : {pkg.ecosystem || "Not Available"}</div>
          <div>
            Vulnerable Version : {pkg.vulnerableVersionRange || "Not Available"}
          </div>
          <div>
            First patched Version : {pkg.firstPatchedVersion || "Not Available"}
          </div>
        </ListItem>
      ))}
    </List>
  );
};

export default CveVulnerablePackagesCard;
