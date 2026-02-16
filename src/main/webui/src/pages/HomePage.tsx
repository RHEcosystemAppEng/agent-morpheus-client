import React from "react";
import { PageSection, Title, Stack, StackItem } from "@patternfly/react-core";
import GetStartedCard from "../components/GetStartedCard";
import MetricsCard from "../components/MetricsCard";

/**
 * HomePage component - displays reports summary
 */
const HomePage: React.FC = () => {
  return (
    <>
      <PageSection>
        <Title headingLevel="h1" size="2xl">
          Home
        </Title>
        <p>Request new analysis and view important system data.</p>
      </PageSection>
      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <GetStartedCard />
          </StackItem>
          <StackItem>
            <MetricsCard />
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};

export default HomePage;
