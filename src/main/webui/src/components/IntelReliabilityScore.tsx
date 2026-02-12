import { Progress, ProgressSize } from "@patternfly/react-core";
import NotAvailable from "./NotAvailable";

interface IntelReliabilityScoreProps {
  score: number | string | null | undefined;
}

/**
 * Component to display Intel Reliability Score with progress bar and confidence level
 */
const IntelReliabilityScore: React.FC<IntelReliabilityScoreProps> = ({
  score,
}) => {
  const isDefined = score !== null && score !== undefined;
  const numeric = Number(score);
  const isNumeric = !Number.isNaN(numeric);

  if (!isDefined || !isNumeric) {
    return <NotAvailable />;
  }

  const confidenceLevel =
    numeric >= 80 ? "high" : numeric >= 50 ? "medium" : "low";

  return (
    <div>
      {isNumeric && (
        <div style={{ marginTop: "0.5rem", maxWidth: "20%" }}>
          <Progress 
            value={numeric} 
            size={ProgressSize.sm}
            aria-label={`Intel Reliability Score: ${numeric}%`}
          />
        </div>
      )}
      <div style={{ marginTop: "0.5rem" }}>
        This score indicates {confidenceLevel} confidence.
      </div>
    </div>
  );
};

export default IntelReliabilityScore;

