import React from 'react';
import { Page, PageSection } from '@patternfly/react-core';
import Navigation from '../components/Navigation';
import ReportsSummaryCard from '../components/ReportsSummaryCard';

/**
 * HomePage component - displays navigation and reports summary
 */
const HomePage: React.FC = () => {
  return (
    <Page sidebar={<Navigation />}>
      <PageSection>
        <ReportsSummaryCard />
      </PageSection>
    </Page>
  );
};

export default HomePage;

