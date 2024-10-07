import { ClipboardCopyButton, CodeBlock, CodeBlockAction, CodeBlockCode, ExpandableSection } from "@patternfly/react-core";
import { BuildRequestJson } from "../services/FormUtilsClient";

export default function RequestPreview({ vulnRequest }) {

  const [copied, setCopied] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const onToggle = (_event, isExpanded) => {
    setIsExpanded(isExpanded);
  };
  const clipboardCopyFunc = (_, text) => {
    navigator.clipboard.writeText(text.toString());
  };
  const onClick = (event, text) => {
    clipboardCopyFunc(event, text);
    setCopied(true);
  };

  let code = ""
  if (vulnRequest !== undefined) {
    code = JSON.stringify(BuildRequestJson(vulnRequest), null, 2);
  }
  const actions = <React.Fragment>
    <CodeBlockAction>
      <ClipboardCopyButton id="copy-button" textId="code-content" aria-label="Copy to clipboard" onClick={e => onClick(e, code)} exitDelay={copied ? 1500 : 600} maxWidth="110px" variant="plain" onTooltipHidden={() => setCopied(false)}>
        {copied ? 'Successfully copied to clipboard!' : 'Copy to clipboard'}
      </ClipboardCopyButton>
    </CodeBlockAction>
  </React.Fragment>
  return <ExpandableSection toggleText={isExpanded ? 'Show less' : 'Show request JSON'} onToggle={onToggle} isExpanded={isExpanded}>
    <CodeBlock actions={actions}>
      <CodeBlockCode id="code-content">{code}</CodeBlockCode>
    </CodeBlock>
  </ExpandableSection>
}