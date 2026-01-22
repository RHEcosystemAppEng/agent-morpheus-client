import React from "react";
import ReportsSummaryCard from "../components/ReportsSummaryCard";
import { PageSection, Title } from "@patternfly/react-core";
import GetStartedCard from "../components/GetStartedCard";
import MetricsCard from "../components/MetricsCard";

/**
 * HomePage component - displays reports summary
 */
const HomePage: React.FC = () => {
  return (
    <>
      <PageSection>
        <Title headingLevel="h1" size="3xl">
          Home
        </Title>
        <p>Request new analysis and view important system data.</p>
      </PageSection>
      <PageSection>
        <GetStartedCard />
        <br />
        <MetricsCard />
        <br />
        <ReportsSummaryCard />
      </PageSection>
    </>
  );
};

export default HomePage;
