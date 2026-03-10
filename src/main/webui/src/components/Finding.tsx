import { Label } from "@patternfly/react-core";
import type { Finding as FindingType } from "../utils/findingDisplay";
import { ExclamationCircleIcon, InProgressIcon } from "@patternfly/react-icons";

export interface FindingProps {
  finding: FindingType | null;
}

const InProgressStatus: React.FC = () => (
  <Label color="grey" variant="outline" icon={<InProgressIcon />}>
    In progress
  </Label>
);

const FailedStatus: React.FC = () => (
  <Label color="grey" variant="filled" icon={<ExclamationCircleIcon />}>
    Failed
  </Label>
);

const Finding: React.FC<FindingProps> = ({ finding }) => {
  if (!finding) return null;
  if (finding.type === "failed") return <FailedStatus />;
  if (finding.type === "in-progress") return <InProgressStatus />;

  const label =
    finding.type === "vulnerable"
      ? "Vulnerable"
      : finding.type === "not-vulnerable"
        ? "Not vulnerable"
        : "Uncertain";
  const labelText =
    finding.count !== undefined ? `${finding.count} ${label}` : label;
  const color =
    finding.type === "vulnerable"
      ? "red"
      : finding.type === "not-vulnerable"
        ? "green"
        : "orange";

  return (
    <Label color={color} variant="filled">
      {labelText}
    </Label>
  );
};

export default Finding;
