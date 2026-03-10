import { Timestamp } from "@patternfly/react-core";

interface FormattedTimestampProps {
  date: string | Date | null | undefined;
}


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
      // Override PatternFly's default font size so the timestamp inherits the font size
      // from its parent context, ensuring it matches the surrounding text
      <Timestamp
        date={dateObj}
        customFormat={{
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }}
        is12Hour
        style={{ fontSize: "unset" }}
      />
    );
  } catch {
    return <></>;
  }
};

export default FormattedTimestamp;