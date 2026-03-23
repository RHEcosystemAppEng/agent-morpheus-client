import { Label } from "@patternfly/react-core";
import { CheckCircleIcon, SyncIcon } from "@patternfly/react-icons";
import { FailedStatus } from "./Finding";
import { isFailingState } from "../utils/findingDisplay";

interface ReportStatusLabelProps {
  state?: string | null;
}

const ReportStatusLabel: React.FC<ReportStatusLabelProps> = ({ state }) => {
  if (!state) return null;

  const formatToTitleCase = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const stateLower = state.toLowerCase();

  if (stateLower === "completed") {
    return (
      <Label status="success" variant="outline" icon={<CheckCircleIcon />}>
        {formatToTitleCase(state)}
      </Label>
    );
  }

  if (isFailingState(state)) {
    return <FailedStatus />;
  }

  if (stateLower === "queued" || stateLower === "sent" || stateLower === "pending") {
    return (
      <Label variant="outline" icon={<SyncIcon />}>
        {formatToTitleCase(state)}
      </Label>
    );
  }

  return (
    <Label status="info" variant="outline">
      {formatToTitleCase(state)}
    </Label>
  );
};

export default ReportStatusLabel;

