import {
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
} from "@patternfly/react-core";
import type { CveMetadata } from "../hooks/useCveDetails";
import NotAvailable from "./NotAvailable";

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
    return <NotAvailable />;
  }

  return (
    <>
      {vulnerablePackages.map((pkg, index) => (
        <div
          key={index}
          style={{
            marginBottom: index < vulnerablePackages.length - 1 ? "1.5rem" : 0,
          }}
        >
          <Title headingLevel="h5" size="md" style={{ marginBottom: "0.5rem" }}>
            <strong>{pkg.name}</strong>
          </Title>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>Ecosystem</DescriptionListTerm>
              <DescriptionListDescription>
                {pkg.ecosystem || <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Vulnerable Version</DescriptionListTerm>
              <DescriptionListDescription>
                {pkg.vulnerableVersionRange || <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>First patched Version</DescriptionListTerm>
              <DescriptionListDescription>
                {pkg.firstPatchedVersion || <NotAvailable />}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </div>
      ))}
    </>
  );
};

export default CveVulnerablePackagesCard;
