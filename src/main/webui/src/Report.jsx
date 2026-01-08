import {Link, useNavigate, useParams} from "react-router-dom";
import {deleteReport, viewReport} from "./services/ReportClient";
import {getComments} from "./services/VulnerabilityClient";
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  CodeBlock,
  CodeBlockCode,
  Divider,
  EmptyState,
  EmptyStateBody,
  ExpandableSection,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  PageSection,
  Panel,
  Skeleton,
  Content,
  ContentVariants,
  getUniqueId,
  List,
  ListComponent,
  ListItem,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  DescriptionList,
  Label,
  Title
} from "@patternfly/react-core";
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import JustificationBanner from "./components/JustificationBanner";
import CvssBanner from "./components/CvssBanner";
import {ConfirmationButton} from "./components/ConfirmationButton";
import {getMetadataColor} from "./Constants";
import FeedbackForm from "./components/FeedbackForm.jsx";

export default function Report() {

  const params = useParams();
  const [report, setReport] = React.useState({});
  const [errorReport, setErrorReport] = React.useState({});
  const [comments, setComments] = React.useState({});
  const [name, setName] = React.useState();
  const [vexExpanded, setVexExpanded] = React.useState(false);
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

  const onDownload = (data, filename) => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element); // cleanup
  };

  const time_meta_fields = [
    "submitted_at",
    "sent_at",
    "product_submitted_at",
    "product_completed_at",
    "product_name",
    "product_version",
    "product_submitted_count"
  ];

  const product_meta_fields = [
    "product_submitted_at",
    "product_name",
    "product_version",
    "product_submitted_count"
  ];

  const time_scan_fields = [
    "started_at",
    "completed_at"
  ];

  const timestamp_labels = {
    "submitted_at": "Submitted",
    "sent_at": "Sent",
    "started_at": "Started",
    "completed_at": "Completed"
  };

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

  const getReportSummary = (report) => {
    if (!report.input) return "Empty report";

    const lines = [];
    lines.push(`Name: ${name}`);
    lines.push('');
    lines.push(`Image: ${report.input.image.name}`);
    lines.push('');

    if (report.output?.analysis) {
      report.output.analysis.forEach(vuln => {
        lines.push(`Vulnerability: ${vuln.vuln_id}`);
        lines.push("");
        if (vuln.justification?.label) {
          lines.push(`Label: ${vuln.justification.label}`);
          lines.push("");
        }
        if (vuln.justification?.reason) {
          lines.push(`Reason: ${vuln.justification.reason}`);
        }
        lines.push('');
        lines.push(`Summary: ${vuln.summary}`);
        lines.push('');
        lines.push('Checklist:');
        if (vuln.checklist) {
          vuln.checklist.forEach(item => {
            lines.push(`Q: ${item.input}`);
            lines.push(`A: ${item.response}`);
          });
        }
        lines.push('---');
      });
    }

    return lines.join('\n');
  };

  const showReport = () => {
    if (errorReport.status !== undefined) {
      if (errorReport.status === 404) {
        return <EmptyState headingLevel="h4" icon={CubesIcon} titleText="Report not found">
          <EmptyStateBody>
            The selected report with id: {params.id} has not been found. Go back to the reports page and select a
            different one.
          </EmptyStateBody>
        </EmptyState>;
      } else {
        return <EmptyState headingLevel="h4" icon={ExclamationCircleIcon}
                           titleText="Could not retrieve the selected report">
          <EmptyStateBody>
            <p>{errorReport.status}: {errorReport.message}</p>
            The selected report with id: {params.id} could not be retrieved. Go back to the reports page and select a
            different one.
          </EmptyStateBody>
        </EmptyState>;
      }
    }

    if (report.input === undefined) {
      return <>
        <Skeleton screenreaderText="Loading contents"/>
        <br/>
        <Skeleton width="40%" screenreaderText="Loading contents"/>
        <Skeleton width="35%" screenreaderText="Loading contents"/>
        <br/>
        <Skeleton screenreaderText="Loading contents"/>
        <br/>
        <Skeleton screenreaderText="Loading contents"/>
        <br/>
        <Divider/>
        <br/>
        <Skeleton width="10%" screenreaderText="Loading contents"/>
        <br/>
        <Skeleton screenreaderText="Loading contents"/>
        <Skeleton screenreaderText="Loading contents"/>
      </>;
    }

    const image = report.input.image
    const analysis = report.output?.analysis;
    let metadata = [];
    let timestamps = [];
    if (report.metadata !== undefined) {
      Object.keys(report.metadata).forEach(k => {
        if (product_meta_fields.includes(k)) {
          // ignore keys in product_meta_fields
        }
        else if (time_meta_fields.includes(k)) {
          timestamps.push({ key: k, value: report.metadata[k]["$date"] });
        } else {
          metadata.push({key: k, value: report.metadata[k]});
        }
      });
    }
    time_scan_fields.forEach(field => {
      if (report.input.scan[field] !== undefined) {
        timestamps.push({key: field, value: report.input.scan[field]});
      }
    });

    return <Grid hasGutter>
      <Content component="h1">{name}</Content>
      <DescriptionList isHorizontal isCompact>
        <DescriptionListGroup>
          <DescriptionListTerm>Image</DescriptionListTerm>
          <DescriptionListDescription><Link
            to={`/reports?imageName=${image.name}`}>{image.name}</Link></DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Tag</DescriptionListTerm>
          <DescriptionListDescription><Link
            to={`/reports?imageTag=${image.tag}`}>{image.tag}</Link></DescriptionListDescription>
        </DescriptionListGroup>
        {
          timestamps.map(k => {
            return <DescriptionListGroup>
              <DescriptionListTerm>{timestamp_labels[k.key]}</DescriptionListTerm>
              <DescriptionListDescription>{k.value}</DescriptionListDescription>
            </DescriptionListGroup>
          })
        }
        <DescriptionListGroup>
          <DescriptionListTerm>Metadata</DescriptionListTerm>
          <DescriptionListDescription>{metadata?.map(k => <Label
            onClick={() => navigate(`/reports?${k.key}=${k.value}`)}
            color={getMetadataColor(k.key)}>{k.key}:{k.value}</Label>)}</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      {analysis?.map((vuln, v_idx) => {
        const uid = getUniqueId();
        let userComments = '';
        if(comments[vuln.vuln_id] !== undefined) {
          userComments = <DescriptionListGroup>
          <DescriptionListTerm>User comments</DescriptionListTerm>
          <DescriptionListDescription>{comments[vuln.vuln_id]}</DescriptionListDescription>
        </DescriptionListGroup>
        }
        return (<>
            <Title headingLevel="h2" size="lg">
              <Link to={`/reports?vulnId=${vuln.vuln_id}`} style={{color: "black"}}>
                {vuln.vuln_id}
              </Link>
              <JustificationBanner justification={vuln.justification}/>
            </Title>
            <DescriptionList isHorizontal isCompact>
              {userComments}
              <DescriptionListGroup>
                <DescriptionListTerm>Reason</DescriptionListTerm>
                <DescriptionListDescription>{vuln.justification.reason}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Summary</DescriptionListTerm>
                <DescriptionListDescription>{vuln.summary}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>CVSS Vector String</DescriptionListTerm>
                <DescriptionListDescription>{vuln.cvss?.vector_string ?? ''}</DescriptionListDescription>
                <DescriptionListTerm>CVSS Score</DescriptionListTerm>
                <DescriptionListDescription><CvssBanner cvss={vuln.cvss ?? null}/></DescriptionListDescription>
              </DescriptionListGroup>
              {vuln.intel_score !== undefined && vuln.intel_score > 0 && (
                  <>
                    <DescriptionListGroup>
                      <DescriptionListTerm>CVE intel score</DescriptionListTerm>
                      <DescriptionListDescription>{vuln?.intel_score ?? ''}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </>
                  )
              }
            <DescriptionListGroup>
                <DescriptionListTerm>VEX</DescriptionListTerm>
                <DescriptionListDescription>
                  {report.output?.vex && 
                  <Flex columnGap={{ default: 'columnGapSm' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                    <FlexItem>
                      <Button 
                        variant="secondary" 
                        onClick={() => onDownload(report.output.vex, `${name}_vex.json`)}
                        size="sm"
                      >
                        Download VEX
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <ExpandableSection
                        toggleText={vexExpanded ? "Hide VEX document" : "Show VEX document"}
                        onToggle={(_event, isExpanded) => setVexExpanded(isExpanded)}
                        isExpanded={vexExpanded}
                        isIndented
                        isDisabled={!report.output?.vex}
                      >
                        {report.output?.vex && (
                          <CodeBlock>
                            <CodeBlockCode>
                              {JSON.stringify(report.output.vex, null, 2)}
                            </CodeBlockCode>
                          </CodeBlock>
                        )}
                      </ExpandableSection>
                    </FlexItem>
                  </Flex>
                  }
                </DescriptionListDescription>
            </DescriptionListGroup>
            </DescriptionList>

            {Array.isArray(vuln.checklist) && vuln.checklist.length > 0 && (
                <>
                  <Content component="h2">Checklist:</Content>
                  <List component={ListComponent.ol}>
                    {vuln.checklist.map((item, i_idx) => (
                        <ListItem className="pf-v6-u-pt-m" key={`${v_idx}_${i_idx}`}>
                          <Content key={`${v_idx}_${i_idx}_question`} component={ContentVariants.dt}>
                            Q: {item.input}
                          </Content>
                          <Content key={`${v_idx}_${i_idx}_response`} component={ContentVariants.dd}>
                            A: {item.response}
                          </Content>
                        </ListItem>
                    ))}
                  </List>
                </>
            )}
        </>);
      })}
      <GridItem>
        <Flex columnGap={{ default: 'columnGapSm' }}>
          <Button variant="secondary" onClick={() => onDownload(report, `${name}_report.json`)}>Download</Button>
          <ConfirmationButton btnVariant="danger"
                              onConfirm={() => onDelete()}
                              message={`The report with id: ${name} will be permanently deleted.`}>Delete</ConfirmationButton>
          <Button variant="primary" onClick={() => navigate(-1)}>Back</Button>
        </Flex>
      </GridItem>

      <GridItem span={3}>
        <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">Feedback</Title>
        <FeedbackForm aiResponse={getReportSummary(report)} reportId={params.id}/>
      </GridItem>
    </Grid>
  }
  return <PageSection hasBodyWrapper={false}>
    <Breadcrumb>
      <BreadcrumbItem to="#/reports">Reports</BreadcrumbItem>
      <BreadcrumbItem>{params.id}</BreadcrumbItem>
    </Breadcrumb>
    {showReport()}
  </PageSection>;

}