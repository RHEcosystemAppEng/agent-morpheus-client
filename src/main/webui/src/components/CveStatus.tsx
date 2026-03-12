import { Label } from "@patternfly/react-core";
import { apiToColor, apiToDisplay } from "../utils/justificationStatus";

interface CveStatusProps {
  status: string;
}

/**
 * Component to display CVE status based on justification
 */
const CveStatus: React.FC<CveStatusProps> = ({ status }) => (
  <Label color={apiToColor(status)}>{apiToDisplay(status)}</Label>
);

export default CveStatus;

