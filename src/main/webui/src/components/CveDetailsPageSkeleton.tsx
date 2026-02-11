import { PageSection, Grid, GridItem, Skeleton } from "@patternfly/react-core";
import SkeletonCard from "./SkeletonCard";

/**
 * Skeleton loading state for the CVE Details page
 * Matches the structure of CveDetailsPage content
 */
const CveDetailsPageSkeleton: React.FC = () => {
  return (
    <>
      <PageSection>
        <Grid hasGutter>
          <GridItem>
            <Skeleton width="15%" screenreaderText="Loading breadcrumb" />
          </GridItem>
          <GridItem>
            <Skeleton width="30%" screenreaderText="Loading title" />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <SkeletonCard
              widths={["40%", "60%", "45%"]}
              screenreaderText="Loading details card"
            />
          </GridItem>
          <GridItem span={6}>
            <SkeletonCard
              widths={["35%", "50%", "45%"]}
              screenreaderText="Loading metadata card"
            />
          </GridItem>
          <GridItem span={6}>
            <SkeletonCard
              widths={["50%", "65%", "55%"]}
              screenreaderText="Loading vulnerable packages card"
            />
          </GridItem>
          <GridItem span={6}>
            <SkeletonCard
              widths={["45%", "60%", "50%"]}
              screenreaderText="Loading references card"
            />
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

export default CveDetailsPageSkeleton;
