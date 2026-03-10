import { PageSection, Title } from "@patternfly/react-core";
import ReportsPageContent from "../components/ReportsPageContent";

const ReportsPage: React.FC = () => {
  return (
    <>
      <PageSection isWidthLimited aria-label="Reports header">
        <Title headingLevel="h1" size="2xl">
          Reports
        </Title>
        <p className="pf-v6-u-mt-sm">
          View comprehensive report for your product and their security analysis.
          Reports include CVE exploitability assessments, VEX status
          justifications, and detailed analysis summaries.
        </p>
      </PageSection>
      <ReportsPageContent />
    </>
  );
};

export default ReportsPage;
