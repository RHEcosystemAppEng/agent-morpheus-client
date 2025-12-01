import React from 'react';
import { Page, PageSection } from '@patternfly/react-core';
import Navigation from '../components/Navigation';
import ReportsSummaryCard from '../components/ReportsSummaryCard';
import GetStartedCard from '../components/GetStartedCard';

/**
 * HomePage component - displays navigation and reports summary
 */
const HomePage: React.FC = () => {
  return (
    <Page sidebar={<Navigation />}>
      <PageSection>
        <ReportsSummaryCard />
        <br />
        <GetStartedCard />
      </PageSection>
    </Page>
  );
};

export default HomePage;

