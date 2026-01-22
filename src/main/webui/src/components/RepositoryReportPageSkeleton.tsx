import {
  Grid,
  GridItem,
  Skeleton,
} from "@patternfly/react-core";
import SkeletonCard from "./SkeletonCard";

/**
 * Skeleton loading state for the repository report page
 * Matches the structure of RepositoryReportPage content
 */
const RepositoryReportPageSkeleton: React.FC = () => {
  return (
    <Grid hasGutter>
      <GridItem>
        <Skeleton width="50%" screenreaderText="Loading title" />
      </GridItem>
      <GridItem>
        <SkeletonCard
          widths={["40%", "60%", "45%"]}
          screenreaderText="Loading details card"
        />
      </GridItem>
      <GridItem>
        <SkeletonCard
          lines={4}
          widths={["70%", "65%", "80%", "55%"]}
          screenreaderText="Loading checklist card"
        />
      </GridItem>
      <GridItem>
        <SkeletonCard
          widths={["35%", "50%", "45%", "40%"]}
          lines={4}
          screenreaderText="Loading additional details card"
        />
      </GridItem>
    </Grid>
  );
};

export default RepositoryReportPageSkeleton;

