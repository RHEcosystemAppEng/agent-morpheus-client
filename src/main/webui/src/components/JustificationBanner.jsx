import { Label } from "@patternfly/react-core"

export default function JustificationBanner ({ justification }) {
  if (justification.status === "FALSE") {
    return <Label color="green">{justification.label}</Label>
  }
  if (justification.status === "UNKNOWN") {
    return <Label color="grey">{justification.label}</Label>
  }
  return <Label color="red">{justification.label}</Label>
}
