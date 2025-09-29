import { useParams } from "react-router-dom";
import { viewReport } from "./services/ReportClient";
import { Breadcrumb, BreadcrumbItem, Divider, EmptyState, EmptyStateBody, PageSection, Skeleton, Title, Grid, GridItem, Content } from "@patternfly/react-core";
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import DetailsCard from "./components/DetailsCard";
import ChecklistCard from "./components/ChecklistCard";
import AdditionalDetailsCard from "./components/AdditionalDetailsCard";

/** @typedef {import('./types').Report} Report */
/** @typedef {import('./types').Vuln} Vuln */

export default function Report() {

  const params = useParams();
  /** @type {Report} */
  const [report, setReport] = React.useState({});
  const [errorReport, setErrorReport] = React.useState({});
  const image = report?.input?.image || {};
  const vuln = report?.output?.[0] || {};
  const reportId = `${vuln.vuln_id} | ${image.name} | ${image.tag}`;
  React.useEffect(() => {
    viewReport(params.id)
      .then(r => {

        /** @type {Report} */
        const typed = r;
        setReport(typed);
      })
      .catch(e => setErrorReport(e));
  }, []);

  const showReport = () => {
    if (errorReport.status !== undefined) {
      if (errorReport.status === 404) {
        return <EmptyState headingLevel="h4" icon={CubesIcon} titleText="Report not found">
          <EmptyStateBody>
            The selected report with id: {params.id} has not been found. Go back to the reports page and select a different one.
          </EmptyStateBody>
        </EmptyState>;
      } else {
        return <EmptyState headingLevel="h4" icon={ExclamationCircleIcon} titleText="Could not retrieve the selected report">
          <EmptyStateBody>
            <p>{errorReport.status}: {errorReport.message}</p>
            The selected report with id: {params.id} could not be retrieved. Go back to the reports page and select a different one.
          </EmptyStateBody>
        </EmptyState>;
      }
    }

    if (report.input === undefined) {
      return <>
        <Skeleton screenreaderText="Loading contents" />
        <br />
        <Skeleton width="40%" screenreaderText="Loading contents" />
        <Skeleton width="35%" screenreaderText="Loading contents" />
        <br />
        <Skeleton screenreaderText="Loading contents" />
        <br />
        <Skeleton screenreaderText="Loading contents" />
        <br />
        <Divider />
        <br />
        <Skeleton width="10%" screenreaderText="Loading contents" />
        <br />
        <Skeleton screenreaderText="Loading contents" />
        <Skeleton screenreaderText="Loading contents" />
      </>;
    }

    const output = report.output;

    return (
      <Grid hasGutter>
        <GridItem>
          <Title headingLevel="h1">CVE Repository Report:{" "}
            <span style={{ fontSize: 'var(--pf-t--global--font--size--heading--h6)' }}>{reportId}</span>
          </Title>
        </GridItem>
        <GridItem>
          <DetailsCard report={report} />
        </GridItem>
        <GridItem>
          <ChecklistCard vulns={output} />
        </GridItem>
        <GridItem>
          <AdditionalDetailsCard report={report} />
        </GridItem>
      </Grid>
    );
  }
  return <PageSection hasBodyWrapper={false} >
    <Breadcrumb>
      <BreadcrumbItem to="#/reports">Reports</BreadcrumbItem>
      <BreadcrumbItem>{reportId}</BreadcrumbItem>
    </Breadcrumb>
    {showReport()}
  </PageSection>;

}