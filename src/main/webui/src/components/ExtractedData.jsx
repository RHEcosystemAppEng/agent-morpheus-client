import { DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm } from "@patternfly/react-core";
import { countComponents } from '../services/FormUtilsClient';

export default function ExtractedData({vulnRequest}) {

  if(vulnRequest.sbom === undefined) {
    return "Select a valid SBOM"
  }

  const components = countComponents(vulnRequest.sbom);

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
      <DescriptionListDescription>{components}</DescriptionListDescription>
    </DescriptionListGroup>
  </DescriptionList>;
}