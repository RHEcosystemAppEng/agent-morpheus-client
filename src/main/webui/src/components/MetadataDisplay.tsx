import { Label, LabelGroup } from "@patternfly/react-core";
import NotAvailable from "./NotAvailable";

interface MetadataDisplayProps {
  metadata: Record<string, string | { $date: string }> | undefined;
}

const formatMetadataValue = (value: string | { $date: string }): string => {
  // Handle MongoDB date format if present
  if (value && typeof value === "object" && "$date" in value) {
    return (value as { $date: string }).$date;
  }
  return String(value);
};

const MetadataDisplay: React.FC<MetadataDisplayProps> = ({ metadata }) => {
  if (!metadata) {
    return <NotAvailable />;
  }

  const entries = Object.entries(metadata);

  if (entries.length === 0) {
    return <NotAvailable />;
  }

  return (
    <LabelGroup>
      {entries.map(([key, value], idx) => (
        <Label key={`${key}_${idx}`} style={{maxWidth: "300px"}}>
          <span style={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
            {key}:{formatMetadataValue(value)}
          </span>          
        </Label>
      ))}
    </LabelGroup>
  );
};

export default MetadataDisplay;

