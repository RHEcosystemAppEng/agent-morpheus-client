import ReactMarkdown from "react-markdown";
import { Content } from "@patternfly/react-core";
import type { CveMetadata } from "../hooks/useCveDetails";
import NotAvailable from "./NotAvailable";

interface CveDescriptionCardProps {
  metadata: CveMetadata | null;
}

/**
 * Component to display CVE description with markdown rendering support
 * Content from PatternFly automatically applies styling to standard HTML elements
 * (h1-h6, p, ul, ol, blockquote) and overrides the base CSS reset.
 */
const CveDescriptionCard: React.FC<CveDescriptionCardProps> = ({
  metadata,
}) => {
  const description = metadata?.description;
  const descriptionSource = metadata?.descriptionSource;

  if (!description) {
    return <NotAvailable />;
  }

  // Render markdown if source is GHSA, otherwise render as plain text
  if (descriptionSource === "ghsa") {
    return (
      <Content>
        <ReactMarkdown>{description}</ReactMarkdown>
      </Content>
    );
  }

  return (
    <Content>
      {description}
    </Content>
  );
};

export default CveDescriptionCard;
