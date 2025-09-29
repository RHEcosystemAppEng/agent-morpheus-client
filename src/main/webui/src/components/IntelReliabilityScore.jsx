import { Progress, ProgressSize } from "@patternfly/react-core";

/**
 * @param {Object} props
 * @param {number|string|null|undefined} props.score
 */
export default function IntelReliabilityScore({ score }) {
  const isDefined = score !== null && score !== undefined;
  const numeric = Number(score);
  const isNumeric = !Number.isNaN(numeric);

  if (!isDefined || !isNumeric) {
    return null;
  }

  const confidenceLevel = numeric >= 80 ? "high" : numeric >= 50 ? "medium" : "low";

  return (
    <div>
      {isNumeric && (
        <div style={{ marginTop: 8, maxWidth: "20%" }}>
          <Progress value={numeric} size={ProgressSize.sm}/>
        </div>
      )}
      <div style={{ marginTop: 8 }}>This score indicates {confidenceLevel} confidence.</div>
    </div>
  );
} 