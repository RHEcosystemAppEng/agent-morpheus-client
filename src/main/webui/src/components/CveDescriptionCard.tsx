import ReactMarkdown from "react-markdown";
import { Content, EmptyState, EmptyStateBody } from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";
import type { CveMetadata } from "../hooks/useCveDetails";

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
    return (
      <EmptyState
        titleText="No description available"
        headingLevel="h4"
        icon={SearchIcon}
      >
        <EmptyStateBody>No description available for this CVE.</EmptyStateBody>
      </EmptyState>
    );
  }

  // Render markdown if source is GHSA, otherwise render as plain text
  if (descriptionSource === "ghsa") {
    return (
      <Content>
        <ReactMarkdown>{description}</ReactMarkdown>
      </Content>
    );
  }

  return <Content>{description}</Content>;
};

export default CveDescriptionCard;
