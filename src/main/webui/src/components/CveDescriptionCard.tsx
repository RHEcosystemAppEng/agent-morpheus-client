import ReactMarkdown from "react-markdown";
import { Content, EmptyState, EmptyStateBody } from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";
import type { CveMetadata } from "../hooks/useCveDetails";

interface CveDescriptionCardProps {
  metadata: CveMetadata | null;
}

/**
 * CVE description rendered as markdown inside PatternFly `Content`, matching
 * report Details (summary/reason) and analysis Q&A responses in `ChecklistCard`.
 */
const CveDescriptionCard: React.FC<CveDescriptionCardProps> = ({
  metadata,
}) => {
  const description = metadata?.description;

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

  return (
    <Content>
      <ReactMarkdown>{description}</ReactMarkdown>
    </Content>
  );
};

export default CveDescriptionCard;
