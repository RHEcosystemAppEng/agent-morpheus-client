import { Flex, FlexItem } from "@patternfly/react-core";
import {
  SeverityCriticalIcon,
  SeverityImportantIcon,
  SeverityMinorIcon,
  SeverityModerateIcon,
  SeverityNoneIcon,
} from "@patternfly/react-icons";
import type { Cvss } from "../types/FullReport";
import NotAvailable from "./NotAvailable";

interface CvssBannerProps {
  cvss: Cvss | null;
}

/**
 * Component to display CVSS score with severity icon and text
 */
const CvssBanner: React.FC<CvssBannerProps> = ({ cvss }) => {
  if (cvss === null || cvss === undefined || cvss.score === "") {
    return <NotAvailable />;
  }

  const score = parseFloat(cvss.score);
  if (isNaN(score)) {
    return <span>{cvss.score}</span>;
  }

  let severity = "";
  let Icon: React.ComponentType<{ color?: string }> | null = null;
  let color = "dimgray";

  if (score === 0.0) {
    severity = "None";
    Icon = SeverityNoneIcon;
    color = "darkseagreen";
  } else if (score > 0.0 && score < 4.0) {
    severity = "Low";
    Icon = SeverityMinorIcon;
    color = "darkgoldenrod";
  } else if (score >= 4.0 && score < 7.0) {
    severity = "Medium";
    Icon = SeverityModerateIcon;
    color = "peru";
  } else if (score >= 7.0 && score < 9.0) {
    severity = "High";
    Icon = SeverityImportantIcon;
    color = "firebrick";
  } else if (score >= 9.0 && score <= 10.0) {
    severity = "Critical";
    Icon = SeverityCriticalIcon;
    color = "indigo";
  }

  if (Icon) {
    return (
      <Flex spaceItems={{ default: "spaceItemsXs" }}>
        <FlexItem>
          <Icon color={color} />
        </FlexItem>
        <FlexItem>
          <span>{severity}</span>
        </FlexItem>
        <FlexItem>
          <span>{cvss.score}</span>
        </FlexItem>
      </Flex>
    );
  }

  return <span>{cvss.score}</span>;
};

export default CvssBanner;

