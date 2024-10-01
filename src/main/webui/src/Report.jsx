import { useNavigate, useParams } from "react-router-dom";
import { viewReport } from "./services/ReportClient";
import { Breadcrumb, BreadcrumbItem, Button, Divider, EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, Grid, GridItem, Label, PageSection, PageSectionVariants, Panel, PanelHeader, PanelMain, PanelMainBody, Skeleton, Text, TextContent, TextList, TextListItem, TextListItemVariants, TextListVariants } from "@patternfly/react-core";
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';

export default function Report() {

  const params = useParams()
  const navigate = useNavigate();
  const [report, setReport] = React.useState({});
  const [errorReport, setErrorReport] = React.useState({});

  React.useEffect(() => {
    viewReport(params.id)
      .then(r => setReport(r))
      .catch(e => setErrorReport(e));
  }, []);

  const JustificationBanner = ({ justification }) => {
    if (justification.status === "FALSE") {
      return <Label color="green">{justification.label}</Label>
    }
    return <Label color="red">{justification.label}</Label>
  }

  const onDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(report)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${params.id}-output.json`;
    document.body.appendChild(element);
    element.click();
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

    const scan = report.input.scan;
    const image = report.input.image
    const info = report.info;
    const output = report.output;

    return <Grid hasGutter>
      <GridItem>
        <TextContent>
          <Text component="h1">{params.id}</Text>
        </TextContent>
      </GridItem>
      <GridItem>
        <Text><span className="pf-v5-u-font-weight-bold">Image:</span> {image.name}</Text>
        <Text><span className="pf-v5-u-font-weight-bold">Tag:</span> {image.tag}</Text>
      </GridItem>

      {output.map((vuln, v_idx) => {
        return <GridItem>
          <Panel>
            <TextContent>
              <Text component="h2">{vuln.vuln_id} <JustificationBanner justification={vuln.justification} /></Text>

            </TextContent>
            <Text><span className="pf-v5-u-font-weight-bold">Reason:</span> {vuln.justification.reason}</Text>
            <Text><span className="pf-v5-u-font-weight-bold">Summary:</span> {vuln.summary}</Text>
            <PanelHeader>

            </PanelHeader>
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
        <Button variant="secondary" onClick={onDownload}>Download</Button>
      </GridItem>
    </Grid>
  }
  return <PageSection variant={PageSectionVariants.light}>
    <Breadcrumb>
      <BreadcrumbItem className="pf-v5-u-primary-color-100" onClick={() => navigate("/reports")}>Reports</BreadcrumbItem>
      <BreadcrumbItem>{params.id}</BreadcrumbItem>
    </Breadcrumb>
    {showReport()}
  </PageSection>;

}