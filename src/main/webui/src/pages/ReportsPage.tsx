import { PageSection, Title } from "@patternfly/react-core";
import { useLocation } from "react-router";
import ReportsPageContent from "../components/ReportsPageContent";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  PAGE_TITLE_REPORTS_SBOMS,
  PAGE_TITLE_REPORTS_SINGLE_REPOSITORIES,
} from "./pageTitles";

const ReportsPage: React.FC = () => {
  const location = useLocation();
  const documentTitle =
    location.pathname === "/reports/single-repositories"
      ? PAGE_TITLE_REPORTS_SINGLE_REPOSITORIES
      : PAGE_TITLE_REPORTS_SBOMS;
  useDocumentTitle(documentTitle);

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
