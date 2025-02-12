import { useNavigate, useParams } from "react-router-dom";
import { deleteReport, viewReport } from "./services/ReportClient";
import { getComments } from "./services/VulnerabilityClient";
import { Breadcrumb, BreadcrumbItem, Button, Divider, EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, Flex, Grid, GridItem, PageSection, PageSectionVariants, Panel, PanelHeader, PanelMain, PanelMainBody, Skeleton, Text, TextContent, TextList, TextListItem, TextListItemVariants, TextListVariants, getUniqueId } from "@patternfly/react-core";
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import JustificationBanner from "./components/JustificationBanner";
import { ConfirmationButton } from "./components/ConfirmationButton";

export default function Report() {

  const params = useParams();
  const [report, setReport] = React.useState({});
  const [errorReport, setErrorReport] = React.useState({});
  const [comments, setComments] = React.useState({});
  const [name, setName] = React.useState();
  const navigate = useNavigate();

  React.useEffect(() => {
    viewReport(params.id)
      .then(r => {

        setReport(r);
        setReportComments(r);
        setName(r.input.scan.id);
      })
      .then(r => setReportComments(r))
      .catch(e => setErrorReport(e));
  }, []);

  const onDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${name}.json`;
    document.body.appendChild(element);
    element.click();
  }

  const onDelete = () => {
    deleteReport(params.id).then(() => navigate('/reports'));
  }

  const setReportComments = (report) => {
    report.input.scan.vulns.forEach(v => {
      getComments(v.vuln_id).then(c => {
        setComments(prevState => ({
          ...prevState,
          [v.vuln_id]: c,
        }));
      });
    });
  }

  const showReport = () => {
    if (errorReport.status !== undefined) {
      if (errorReport.status === 404) {
        return <EmptyState>
          <EmptyStateHeader titleText="Report not found" headingLevel="h4" icon={<EmptyStateIcon icon={CubesIcon} />} />
          <EmptyStateBody>
            The selected report with id: {params.id} has not been found. Go back to the reports page and select a different one.
          </EmptyStateBody>
        </EmptyState>;
      } else {
        return <EmptyState>
          <EmptyStateHeader titleText="Could not retrieve the selected report" headingLevel="h4" icon={<EmptyStateIcon icon={ExclamationCircleIcon} />} />
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

    const image = report.input.image
    const output = report.output;

    return <Grid hasGutter>
      <GridItem>
        <TextContent>
          <Text component="h1">{name}</Text>
        </TextContent>
      </GridItem>
      <GridItem>
        <Text><span className="pf-v5-u-font-weight-bold">Image:</span> {image.name}</Text>
        <Text><span className="pf-v5-u-font-weight-bold">Tag:</span> {image.tag}</Text>
      </GridItem>

      {output?.map((vuln, v_idx) => {
        const uid = getUniqueId();
        return <GridItem key={uid}>
          <Panel>
            <TextContent>
              <Text component="h2">{vuln.vuln_id} <JustificationBanner justification={vuln.justification} /></Text>
              {comments[vuln.vuln_id] !== undefined ? <Text><span className="pf-v5-u-font-weight-bold">User Comments:</span> {comments[vuln.vuln_id]}</Text> : ''}
            </TextContent>
            <Text><span className="pf-v5-u-font-weight-bold">Reason:</span> {vuln.justification.reason}</Text>
            <Text><span className="pf-v5-u-font-weight-bold">Summary:</span> {vuln.summary}</Text>
            <Divider />
            <TextContent><Text component="h1">Checklist:</Text></TextContent>
            <PanelMain>
              <PanelMainBody>
                <TextList component={TextListVariants.ol}>
                  {vuln.checklist.map((item, i_idx) => {
                    return <TextListItem key={`${v_idx}_${i_idx}`}>
                      <TextList component={TextListVariants.dl}>
                        <TextListItem key={`${v_idx}_${i_idx}_question`} component={TextListItemVariants.dt}><Text className="pf-v5-u-font-weight-bold">Q: {item.input}</Text></TextListItem>
                        <TextListItem component={TextListItemVariants.dd}>A: {item.response}</TextListItem>
                      </TextList>
                    </TextListItem>
                  })}
                </TextList>
              </PanelMainBody>
            </PanelMain>
          </Panel>
        </GridItem>
      })}
      <GridItem>
        <Flex columnGap={{ default: 'columnGapSm' }}>
          <Button variant="secondary" onClick={onDownload}>Download</Button>
          <ConfirmationButton btnVariant="danger"
            onConfirm={() => onDelete()}
            message={`The report with id: ${name} will be permanently deleted.`}>Delete</ConfirmationButton>
          <Button variant="primary" onClick={() => navigate(-1)}>Back</Button>
        </Flex>
      </GridItem>
    </Grid>
  }
  return <PageSection variant={PageSectionVariants.light}>
    <Breadcrumb>
      <BreadcrumbItem className="pf-v5-u-primary-color-100" to="#/reports">Reports</BreadcrumbItem>
      <BreadcrumbItem>{name}</BreadcrumbItem>
    </Breadcrumb>
    {showReport()}
  </PageSection>;

}