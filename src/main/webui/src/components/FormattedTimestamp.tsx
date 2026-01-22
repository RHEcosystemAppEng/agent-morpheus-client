import { Timestamp } from "@patternfly/react-core";

interface FormattedTimestampProps {
  date: string | Date | null | undefined;
}

const customFormat = {
  day: "2-digit" as const,
  month: "long" as const,
  year: "numeric" as const,
  hour: "2-digit" as const,
  minute: "2-digit" as const,
  second: "2-digit" as const,
  timeZoneName: "short" as const,
};

const FormattedTimestamp: React.FC<FormattedTimestampProps> = ({ date }) => {
  if (!date) {
    return <></>;
  }

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return <></>;
    }

    return (
      <Timestamp date={dateObj} customFormat={customFormat} is12Hour />
    );
  } catch {
    return <></>;
  }
};

export default FormattedTimestamp;

