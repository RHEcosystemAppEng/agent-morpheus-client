import { Label } from "@patternfly/react-core";
import type { ReportOutput } from "../types/FullReport";
import NotAvailable from "./NotAvailable";

interface CveStatusProps {
  vuln: ReportOutput;
}

/**
 * Component to display CVE status based on justification
 */
const CveStatus: React.FC<CveStatusProps> = ({ vuln }) => {
  const status = vuln?.justification?.status;
  const label = vuln?.justification?.label;

  if (!status || !label) {
    return <NotAvailable />;
  }

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

