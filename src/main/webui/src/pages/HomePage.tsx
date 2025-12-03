import React from 'react';
import ReportsSummaryCard from '../components/ReportsSummaryCard';
import { PageSection, Title } from '@patternfly/react-core';
import GetStartedCard from '../components/GetStartedCard';

/**
 * HomePage component - displays reports summary
 */
const HomePage: React.FC = () => {
  return (
    <>
      <PageSection >
        <Title headingLevel="h1" size="3xl">
          Home
        </Title>
        <p >
          Request new analysis and view important system data.
        </p>
      </PageSection>
      <PageSection>
        <ReportsSummaryCard />
        <br />
        <GetStartedCard />
      </PageSection>
    </>
  );
};

export default HomePage;

