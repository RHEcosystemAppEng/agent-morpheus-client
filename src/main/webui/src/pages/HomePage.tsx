import React from "react";
import { PageSection, Stack, StackItem, Content } from "@patternfly/react-core";
import GetStartedCard from "../components/GetStartedCard";
import MetricsCard from "../components/MetricsCard";

/**
 * HomePage component - displays reports summary
 */
const HomePage: React.FC = () => {
  return (
    <>      
      <PageSection isWidthLimited aria-labelledby="main-title">
          <Content>
            <h1><strong>Home</strong></h1>
            <p>Request new analysis and view important system data.</p>
          </Content>
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
