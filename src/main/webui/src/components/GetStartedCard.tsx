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
  Stack,
  StackItem,
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
        <Content
          component={ContentVariants.h2}
          style={{ fontSize: "1.2rem", color: "black" }}
        >
          Get started with ExploitIQ
        </Content>
      </CardHeader>
      <CardBody>
        <Stack>
          <StackItem>
            <Icon
              size="xl"
              className={css("pf-v6-u-pl-sm", "pf-v6-u-pr-md")}
            >
              <PlusIcon className={classes.actionIcon} />
            </Icon>
            <StackItem style={{ paddingTop: "var(--pf-t--global--spacer--xs)" }}>
            </StackItem>  
          </StackItem>
          <StackItem>
            <Content
              className={css(
                classes.action,
                "pf-v6-u-font-weight-bold",
                "pf-v6-u-mb-xs",
              )}
              style={{ fontSize: "1.1rem", color: "black" }}
            >
              Request Exploitability Analysis
            </Content>
          </StackItem>
          <StackItem style={{ paddingTop: "var(--pf-t--global--spacer--sm)" }}>
            </StackItem>  
          <StackItem>
            <Content className="pf-v6-u-font-size-md">
              Submit an exploitability analysis request with an SBOM file to
              generate a VEX status report.
            </Content>
          </StackItem>
        </Stack>
      </CardBody>
      <CardFooter>
        <Button
          variant="secondary"
          onClick={() => setIsRequestAnalysisModalOpen(true)}
        >
          Request Analysis →
        </Button>
      </CardFooter>
    </Card>,
    <Card isFullHeight isPlain key="card-2">
      <CardHeader style={{ visibility: "hidden" }}>-</CardHeader>
      <CardBody>
        <Stack>
          <StackItem>
            <Icon
              size="xl"
              className={css("pf-v6-u-pl-sm", "pf-v6-u-pr-md")}
            >
              <ChartLineIcon className={classes.actionIcon} />
            </Icon>
            <StackItem style={{ paddingTop: "var(--pf-t--global--spacer--xs)" }}>
            </StackItem>  
          </StackItem>
          <StackItem>
            <Content
              className={css(
                classes.action,
                "pf-v6-u-font-weight-bold",
                "pf-v6-u-mb-xs",
              )}
              style={{ fontSize: "1.1rem", color: "black" }}
            >
              View Reports
            </Content>
          </StackItem>
          <StackItem style={{ paddingTop: "var(--pf-t--global--spacer--sm)" }}>
            </StackItem>  
          <StackItem>
            <Content className="pf-v6-u-font-size-md">
              Explore comprehensive product report with detailed CVE analysis
              results, exploitability assessments, and VEX status.
            </Content>
          </StackItem>
        </Stack>
      </CardBody>
      <CardFooter>
        <Button variant="secondary" onClick={() => navigate("/reports")}>
          View Reports →
        </Button>
      </CardFooter>
    </Card>,
    <Card isFullHeight isPlain key="card-3">
      <CardHeader style={{ visibility: "hidden" }}>-</CardHeader>
      <CardBody>
        <Stack>
          <StackItem>
            <Icon
              size="xl"
              className={css("pf-v6-u-pl-sm", "pf-v6-u-pr-md")}
            >
              <BookOpenIcon className={classes.actionIcon} />
            </Icon>
            <StackItem style={{ paddingTop: "var(--pf-t--global--spacer--xs)" }}>
            </StackItem>  
          </StackItem>
          <StackItem>
            <Content
              className={css(
                classes.action,
                "pf-v6-u-font-weight-bold",
                "pf-v6-u-mb-xs",
              )}
              style={{ fontSize: "1.1rem", color: "black" }}
            >
              Learn more
            </Content>
          </StackItem>
          <StackItem style={{ paddingTop: "var(--pf-t--global--spacer--sm)" }}>
            </StackItem>  
          <StackItem>
            <Content className="pf-v6-u-font-size-md">
              Discover how ExploitIQ helps identify false positives and provides
              accurate vulnerability exploitability assessments.
            </Content>
          </StackItem>
        </Stack>
      </CardBody>
      <CardFooter>
        <Button
          variant="secondary"
          component="a"
          href="https://github.com/RHEcosystemAppEng/exploitiq-docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Documentation →
        </Button>
      </CardFooter>
    </Card>,
  ];

  return (
    <>
      <MultiContentCard cards={cards} withDividers />
      {isRequestAnalysisModalOpen && (
        <RequestAnalysisModal
          onClose={() => setIsRequestAnalysisModalOpen(false)}
        />
      )}
    </>
  );
};

export default GetStartedCard;
