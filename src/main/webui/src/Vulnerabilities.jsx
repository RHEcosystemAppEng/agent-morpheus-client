import { Grid, GridItem, PageSection, PageSectionVariants, Text, TextContent } from "@patternfly/react-core";
import VulnerabilitiesTable from "./components/VulnerabilitiesTable";

export default function Vulnerabilities() {
  return <PageSection variant={PageSectionVariants.light}>
    <Grid hasGutter>
      <GridItem>
        <TextContent>
          <Text component="h1">Vulnerabilities</Text>
        </TextContent>
      </GridItem>
      <GridItem>
        <VulnerabilitiesTable />
      </GridItem>
    </Grid>
  </PageSection>;
};