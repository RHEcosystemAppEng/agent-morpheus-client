import { Card, CardBody, Skeleton } from "@patternfly/react-core";

interface SkeletonCardProps {
  /** Number of skeleton lines to display */
  lines?: number;
  /** Width percentages for each skeleton line */
  widths?: string[];
  /** Screen reader text for accessibility */
  screenreaderText?: string;
}

/**
 * Reusable skeleton card component for loading states
 */
const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  widths = ["30%", "50%", "45%"],
  screenreaderText = "Loading card content",
}) => {
  return (
    <Card>
      <CardBody>
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index}>
            <Skeleton
              width={widths[index] || "50%"}
              screenreaderText={screenreaderText}
            />
            {index < lines - 1 && <br />}
          </div>
        ))}
      </CardBody>
    </Card>
  );
};

export default SkeletonCard;

