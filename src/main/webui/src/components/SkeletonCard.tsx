import { Card, CardBody, Skeleton, Stack, StackItem } from "@patternfly/react-core";

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
        <Stack hasGutter>
          {Array.from({ length: lines }).map((_, index) => (            
            <StackItem key={index} aria-hidden="true">
              <Skeleton
                width={widths[index] || "50%"}
                screenreaderText={screenreaderText}
              />
              </StackItem>
            ))}
        </Stack>        
      </CardBody>
    </Card>
  );
};

export default SkeletonCard;

