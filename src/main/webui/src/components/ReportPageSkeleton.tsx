import {
  PageSection,
  Grid,
  GridItem,
  Skeleton,
  Card,
  CardBody,
} from "@patternfly/react-core";
import SkeletonCard from "./SkeletonCard";

/**
 * Skeleton loading state for the report page
 * Matches the structure of ReportPage content
 */
const ReportPageSkeleton: React.FC = () => {
  return (
    <>
      <PageSection>
        <Grid hasGutter>
          <GridItem>
            <Skeleton width="15%" screenreaderText="Loading breadcrumb" />
          </GridItem>
          <GridItem>
            <Skeleton width="40%" screenreaderText="Loading title" />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <SkeletonCard
              widths={["30%", "50%", "45%"]}
              screenreaderText="Loading card content"
            />
          </GridItem>
          <GridItem span={6}>
            <SkeletonCard
              widths={["35%", "60%", "40%"]}
              screenreaderText="Loading card content"
            />
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Grid hasGutter>
          <GridItem span={6}>
            <Card>
              <CardBody>
                <Skeleton height="200px" screenreaderText="Loading chart" />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card>
              <CardBody>
                <Skeleton height="200px" screenreaderText="Loading chart" />
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </PageSection>
      <PageSection>
        <Skeleton height="300px" screenreaderText="Loading table" />
      </PageSection>
    </>
  );
};

export default ReportPageSkeleton;

