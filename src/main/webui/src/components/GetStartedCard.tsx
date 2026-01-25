import { FunctionComponent, useState } from "react";
import MultiContentCard from "@patternfly/react-component-groups/dist/dynamic/MultiContentCard";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Content,
  ContentVariants,
  Icon,
} from "@patternfly/react-core";
import { PlusIcon, ChartLineIcon, BookOpenIcon } from "@patternfly/react-icons";
import { createUseStyles } from "react-jss";
import { css } from "@patternfly/react-styles";
import { useNavigate } from "react-router";
import RequestAnalysisModal from "./RequestAnalysisModal";

const useStyles = createUseStyles({
  action: {
    color: "var(--pf-t--global--text--color--brand--default)",
    fontSize: "var(--pf-t--global--font--size--sm)",
  },
  actionIcon: {
    color: "#0066cc",
  },
});

const GetStartedCard: FunctionComponent = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const [isRequestAnalysisModalOpen, setIsRequestAnalysisModalOpen] =
    useState(false);

  const cards = [
    <Card isFullHeight isPlain key="card-1">
      <CardHeader>
        <Content component={ContentVariants.h2} style={{ fontSize: "1.2rem" }} >
          Get started with ExploitIQ
        </Content>
      </CardHeader>
      <CardBody>
        <Content
          className={css(
            classes.action,
            "pf-v6-u-font-weight-bold",
            "pf-v6-u-mb-md"
          )}
          style={{ fontSize: "1.1rem" }}
        >
          <Icon size="lg" style={{ marginRight: "9px" }} className="pf-v6-u-pl-sm pf-v6-u-pr-md">
            <PlusIcon className={classes.actionIcon} />
          </Icon>
          Request analysis
        </Content>
        <Content className="pf-v6-u-font-size-md">
           Submit an exploitability analysis request with an SBOM file to
          generate a VEX status report.
        </Content>
      </CardBody>
      <CardFooter>
        <Button
          variant="link"
          isInline
          onClick={() => setIsRequestAnalysisModalOpen(true)}
        >
          Request Analysis →
        </Button>
      </CardFooter>
    </Card>,
    <Card isFullHeight isPlain key="card-2">
      <CardHeader style={{ visibility: "hidden" }}>-</CardHeader>
      <CardBody>
        <Content
          className={css(
            classes.action,
            "pf-v6-u-font-weight-bold",
            "pf-v6-u-mb-md"
          )}
          style={{ fontSize: "1.1rem" }}
        >
          <Icon size="lg" style={{ marginRight: "9px" }}className="pf-v6-u-pl-sm pf-v6-u-pr-md">
            <ChartLineIcon className={classes.actionIcon} />
          </Icon>
          View Reports
        </Content>
        <Content className="pf-v6-u-font-size-md">
          Explore comprehensive product report with detailed CVE analysis
          results, exploitability assessments, and VEX status.
        </Content>
      </CardBody>
      <CardFooter>
        <Button variant="link" isInline onClick={() => navigate("/reports")}>
          View Reports →
        </Button>
      </CardFooter>
    </Card>,
    <Card isFullHeight isPlain key="card-3">
      <CardHeader style={{ visibility: "hidden" }}>-</CardHeader>
      <CardBody>
        <Content
          className={css(
            classes.action,
            "pf-v6-u-font-weight-bold",
            "pf-v6-u-mb-md"
          )}
          style={{ fontSize: "1.1rem" }}
        >
          <Icon size="lg" style={{ marginRight: "9px" }} className="pf-v6-u-pl-sm pf-v6-u-pr-md">
            <BookOpenIcon className={classes.actionIcon} />
          </Icon>
          Learn more
        </Content>
        <Content className="pf-v6-u-font-size-md">
          Discover how ExploitIQ helps identify false positives and provides
          accurate vulnerability exploitability assessments.
        </Content>
      </CardBody>
      <CardFooter>
        <Button variant="link" isInline>
          View Documentation →
        </Button>
      </CardFooter>
    </Card>,
  ];

  return (
    <>
      <MultiContentCard cards={cards} />
      {isRequestAnalysisModalOpen && (
        <RequestAnalysisModal
          onClose={() => setIsRequestAnalysisModalOpen(false)}
        />
      )}
    </>
  );
};

export default GetStartedCard;
