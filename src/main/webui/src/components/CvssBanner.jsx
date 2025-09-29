// import { Label } from "@patternfly/react-core"
import { Flex, FlexItem } from "@patternfly/react-core"
import { SeverityCriticalIcon, SeverityImportantIcon, SeverityMinorIcon, SeverityModerateIcon, SeverityNoneIcon } from "@patternfly/react-icons"

export default function CvssBanner ({ cvss }) {
  if (cvss === null || cvss.score === "") {
    return <></>
  }

  const score = parseFloat(cvss.score)

  let severity = ""
  let Icon = null
  let color = "dimgray"

  if (score === 0.0) {
    severity = "None"
    Icon = SeverityNoneIcon
    color = "darkseagreen"
  } else if (score > 0.0 && score < 4.0) {
    severity = "Low"
    Icon = SeverityMinorIcon
    color = "darkgoldenrod"
  } else if (score >= 4.0 && score < 7.0) {
    severity = "Medium"
    Icon = SeverityModerateIcon
    color = "peru"
  } else if (score >= 7.0 && score < 9.0) {
    severity = "High"
    Icon = SeverityImportantIcon
    color = "firebrick"
  } else if (score >= 9.0 && score <= 10.0) {
    severity = "Critical"
    Icon = SeverityCriticalIcon
    color = "indigo"
  }

  if (Icon) {
    return (
      <Flex spaceItems={{ default: 'spaceItemsXs' }}>
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
    )
  }

  return <span>{cvss.score}</span>
}
