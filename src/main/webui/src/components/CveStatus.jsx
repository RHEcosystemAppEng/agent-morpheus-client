import { Label } from "@patternfly/react-core";

/**
 * @param {{ vuln?: { justification?: { status?: string, label?: string } } }} props
 */
export default function CveStatus({ vuln }) {
  const status = String(vuln?.justification?.status || 'UNKNOWN').toUpperCase();

  if (!vuln) {
    return "-"
  }

  if (status === 'TRUE') {
    return <Label color="red">Vulnerable</Label>;
  }

  if (status === 'FALSE') {
    const text = vuln?.justification?.label || 'Not Vulnerable';
    return <Label color="green">{text}</Label>;
  }

  return <Label color="gold">Uncertain</Label>;
} 