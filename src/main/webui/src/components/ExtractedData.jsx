import { DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, PageSection, Text, TextContent } from "@patternfly/react-core";

export default function ExtractedData({vulnRequest}) {
  return <DescriptionList isHorizontal>
    <DescriptionListGroup>
      <DescriptionListTerm>Container Image Name: </DescriptionListTerm>
      <DescriptionListDescription>{vulnRequest.name}</DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Container Image Tag: </DescriptionListTerm>
      <DescriptionListDescription>{vulnRequest.version}</DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Repository: </DescriptionListTerm>
      <DescriptionListDescription>{vulnRequest.repository}</DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Source Ref: </DescriptionListTerm>
      <DescriptionListDescription>{vulnRequest.commitRef}</DescriptionListDescription>
    </DescriptionListGroup>
    <DescriptionListGroup>
      <DescriptionListTerm>Components: </DescriptionListTerm>
      <DescriptionListDescription>{vulnRequest.components?.length}</DescriptionListDescription>
    </DescriptionListGroup>
  </DescriptionList>;
}