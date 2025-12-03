import React from "react";
import { PageSection, Title } from "@patternfly/react-core";
import ReportsTable from "../components/ReportsTable";

/**
 * ReportsPage component - displays reports table with filter and search
 */
const ReportsPage: React.FC = () => {
  return (
    <>
      <PageSection>
        <Title headingLevel="h1" size="3xl">
          Reports
        </Title>
        <p>
          View comprehensive report for your product and their security
          analysis. Reports include CVE exploitability assessments, VEX status
          justifications, and detailed analysis summaries.
        </p>
      </PageSection>
      <PageSection>
        <ReportsTable />
      </PageSection>
    </>
  );
};

export default ReportsPage;
