import { Grid, GridItem, PageSection, PageSectionVariants, Text, TextContent } from "@patternfly/react-core";
import ReportsTable from "./components/ReportsTable";

export default function Reports() {
  return <PageSection variant={PageSectionVariants.light}>
    <Grid hasGutter>
      <GridItem>
        <TextContent>
          <Text component="h1">Vulnerability Reports</Text>
        </TextContent>
      </GridItem>
      <GridItem>
        <ReportsTable  />
      </GridItem>
    </Grid>
  </PageSection>;
};