import { Label } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SyncIcon,
} from "@patternfly/react-icons";

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

  if (stateLower === "expired") {
    return (
      <Label status="danger" variant="outline" icon={<ExclamationTriangleIcon />}>
        {formatToTitleCase(state)}
      </Label>
    );
  }

  if (stateLower === "failed") {
    return (
      <Label status="danger" variant="outline" icon={<ExclamationTriangleIcon />}>
        {formatToTitleCase(state)}
      </Label>
    );
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

