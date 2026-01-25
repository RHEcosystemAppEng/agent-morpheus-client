import { Label, Icon } from "@patternfly/react-core";
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
      <Label
        variant="outline"
        color="green"
        icon={
          <Icon status="success">
            <CheckCircleIcon />
          </Icon>
        }
      >
        {formatToTitleCase(state)}
      </Label>
    );
  }

  if (stateLower === "expired") {
    return (
      <Label
        variant="outline"
        color="orange"
        icon={
          <Icon status="warning">
            <ExclamationTriangleIcon />
          </Icon>
        }
      >
        {formatToTitleCase(state)}
      </Label>
    );
  }

  if (stateLower === "failed") {
    return (
      <Label
        variant="outline"
        color="red"
        icon={
          <Icon status="danger">
            <ExclamationTriangleIcon />
          </Icon>
        }
      >
        {formatToTitleCase(state)}
      </Label>
    );
  }

  if (stateLower === "queued" || stateLower === "sent") {
    return (
      <Label
        variant="outline"
        color="grey"
        icon={
          <Icon>
            <SyncIcon />
          </Icon>
        }
      >
        {formatToTitleCase(state)}
      </Label>
    );
  }

  return (
    <Label variant="outline" color="grey">
      {formatToTitleCase(state)}
    </Label>
  );
};

export default ReportStatusLabel;

