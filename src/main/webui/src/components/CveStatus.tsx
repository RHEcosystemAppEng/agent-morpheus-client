import { Label } from "@patternfly/react-core";

interface CveStatusProps {
  status: string;
}

/**
 * Component to display CVE status based on justification
 */
const CveStatus: React.FC<CveStatusProps> = ({ status }) => {  

  const getColor = (
    status: string
  ): "red" | "green" | "grey" | "orange" | undefined => {
    if (status === "TRUE" || status === "true") return "red";
    if (status === "FALSE" || status === "false") return "green";
    if (status === "UNKNOWN" || status === "unknown") return "grey";
    return "orange";
  };

  const getLabel = (
    status: string
  ): string => {
    if (status === "TRUE" || status === "true") return "Vulnerable";
    if (status === "FALSE" || status === "false") return "Not Vulnerable";
    if (status === "UNKNOWN" || status === "unknown") return "Uncertain";
    return status;
  };

  return <Label color={getColor(status)}>{getLabel(status)}</Label>;
};

export default CveStatus;

