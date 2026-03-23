import { Label, LabelProps } from "@patternfly/react-core";
import type { Finding as FindingType } from "../utils/findingDisplay";
import { ExclamationCircleIcon, InProgressIcon } from "@patternfly/react-icons";
import { apiToColor, JUSTIFICATION_API } from "../utils/justificationStatus";

export interface FindingProps {
  finding: FindingType | null;
}

const InProgressStatus: React.FC = () => (
  <Label color="grey" variant="outline" icon={<InProgressIcon />}>
    In progress
  </Label>
);

export const FailedStatus: React.FC = () => (
  <Label color="grey" variant="filled" icon={<ExclamationCircleIcon />}>
    Failed
  </Label>
);

const Finding: React.FC<FindingProps> = ({ finding }) => {
  if (!finding) return null;
  
  let label: string;
  let color: LabelProps["color"];

  switch (finding.type) {
    case "failed":
      return <FailedStatus />;
    case "in-progress":
      return <InProgressStatus />;
    case "vulnerable":
      label = "Vulnerable";
      color = apiToColor(JUSTIFICATION_API.VULNERABLE);
      break;
    case "not-vulnerable":
      label = "Not vulnerable";
      color = apiToColor(JUSTIFICATION_API.NOT_VULNERABLE);
      break;
    case "excluded":
      label = "Excluded";
      color = "grey";
      break;
    case "uncertain":
      label = "Uncertain";
      color = apiToColor(JUSTIFICATION_API.UNCERTAIN);
      break;
    default: {
      return null;
    }
  }

  const labelText =
    finding.count !== undefined ? `${finding.count} ${label}` : label;

  return (
    <Label color={color} variant="filled">
      {labelText}
    </Label>
  );
};

export default Finding;
