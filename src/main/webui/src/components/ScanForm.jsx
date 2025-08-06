import { ActionGroup, Button, FileUpload, Flex, FlexItem, Form, FormGroup, FormSection, FormSelect, FormSelectOption, TextInput } from "@patternfly/react-core";
import Remove2Icon from '@patternfly/react-icons/dist/esm/icons/remove2-icon';
import AddCircleOIcon from '@patternfly/react-icons/dist/esm/icons/add-circle-o-icon';

import { newMorpheusRequest, sbomTypes } from "../services/FormUtilsClient";

export const ScanForm = ({ vulnRequest, handleVulnRequestChange, onNewAlert }) => {
  const [cves, setCves] = React.useState(vulnRequest['cves'] || [{}]);
  const [sbom, setSbom] = React.useState(vulnRequest['sbom'] || {});
  const [metadata, setMetadata] = React.useState(vulnRequest['metadata'] || [{}]);
  const [sbomType, setSbomType] = React.useState(vulnRequest['sbomType'] || 'manual');
  const [filename, setFilename] = React.useState(vulnRequest['filename'] || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [canSubmit, setCanSubmit] = React.useState(false);

  const handleMetadataChange = (idx, field, newValue) => {
    const updatedMetadata = [...metadata];
    updatedMetadata[idx][field] = newValue;
    setMetadata(updatedMetadata);
    onFormUpdated({ metadata: updatedMetadata });
  };

  const handleAddMetadata = () => {
    setMetadata((prevMetadata) => {
      const updatedElems = [...prevMetadata, { name: "", value: ""}];
      onFormUpdated({ metadata: updatedElems });
      return updatedElems;
    });
  }

  const handleDeleteMetadata = idx => {
    const updatedMetadata = metadata.filter((_, i) => i !== idx);
    setMetadata(updatedMetadata);
    onFormUpdated({ metadata: updatedMetadata });
  }

  const handleCveChange = (idx, name) => {

    setCves((prevElements) => {
      const updatedElems = prevElements.map((element, index) =>
        index === idx ? { ...element, name: name } : element
      );
      onFormUpdated({ cves: updatedElems });
      return updatedElems;
    });
  };

  const handleAddCve = () => {
    setCves((prevCveList) => {
      const updatedElems = [
        ...prevCveList,
        { name: '' }
      ];
      onFormUpdated({ cves: updatedElems });
      return updatedElems
    });
  }

  const handleDeleteCve = idx => {
    setCves((prevCveList) => {
      const updatedElems = prevCveList.filter((_, index) => index !== idx);
      onFormUpdated({ cves: updatedElems });
      return updatedElems
    });
  }

  const handleFileInputChange = (_, file) => {
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      const loadedSbom = JSON.parse(e.target.result)
      setSbom(loadedSbom);
      onFormUpdated({
        sbom: loadedSbom
      });
    }
    setFilename(file.name);
  }
  const handleSbomTypeChange = (_, type) => {
    setSbomType(type);
    onFormUpdated({ sbomType: type });
  }
  const handleFileReadStarted = (_event, _fileHandle) => {
    setIsLoading(true);
  };
  const handleFileReadFinished = (_event, _fileHandle) => {
    setIsLoading(false);
  };

  const handleClear = _ => {
    setFilename('');
    setSbom('');
    onFormUpdated();
  }

  const onSubmitForm = () => {
    setCanSubmit(false);
    newMorpheusRequest(vulnRequest)
      .then(response => {
        if (response.ok) {
          onNewAlert('success', 'Analysis request sent to Morpheus');
        } else {
          response.json().then(json => onNewAlert('danger', `Unable to send request: ${response.status}:${json.error}`)); 
        }
      }).catch(error => {
        onNewAlert('danger', `Unable to send request: ${error}`)
      }).finally(() => setCanSubmit(true));
  }

  const onFormUpdated = (update) => {
    if(update === undefined) {
      setCanSubmit(false);
    }
    const updated = handleVulnRequestChange(update);
    
    const updatedCves = updated['cves'];    
    if (updatedCves === undefined || updatedCves.length === 0) {
      setCanSubmit(false);
      handleVulnRequestChange(update);
      return;
    }
    for (let value of updatedCves) {
      if (value.name === undefined || value.name.trim() === '') {
        setCanSubmit(false);
        handleVulnRequestChange(update);
        return;
      }
    }

    const metadata = updated['metadata'] || [];
    for (let pair of metadata) {
      if (!pair.name || pair.name.trim() === '' || !pair.value || pair.value.trim() === '') {
        setCanSubmit(false);
        handleVulnRequestChange(update);
        return;
      }
    }

    if (updated.sbom === undefined || updated.sbom === '') {
      setCanSubmit(false);
    } else {
      setCanSubmit(true);
    }
  }

  return <Form isHorizontal>
    <FormSection title="Metadata">
      {metadata.map((m, idx) => {
        return <div key={`metadata_${idx}_pair`}>
          <FormGroup fieldId={`metadata_${idx}_pair`}>
            <Flex>
              <FlexItem>
                <TextInput isRequired type="text" id={`metadata_${idx}_name`} value={m.name || ""} onChange={event => handleMetadataChange(idx, "name", event.target.value)} placeholder="Name"></TextInput>
              </FlexItem>
              <FlexItem>
                <TextInput isRequired type="text" id={`metadata_${idx}_value`} value={m.value || ""} onChange={event => handleMetadataChange(idx, "value", event.target.value)} placeholder="Value"></TextInput>
              </FlexItem>
              <FlexItem>
                <Button icon={<Remove2Icon />} variant="danger" aria-label="Delete Metadata" onClick={_ => handleDeleteMetadata(idx)}>
                  
                </Button>
              </FlexItem>
            </Flex>
          </FormGroup>
        </div>
      })}
      <Flex justifyContent={{ default: 'justifyContentFlexStart' }}>
        <FlexItem>
          <Button icon={<AddCircleOIcon />} variant="primary" aria-label="Add Metadata" onClick={handleAddMetadata}>
             Add Metadata
          </Button>
        </FlexItem>
      </Flex>
    </FormSection>
    <FormSection title="CVEs">
      {cves.map((cve, idx) => {
        return <div key={`cve_${idx}_group`}>
          <FormGroup label="CVE" isRequired fieldId={`cve_${idx}_name`}>
            <Flex>
              <FlexItem>
                <TextInput isRequired type="text" id={`cve_${idx}_name`} value={cve.name || ""} onChange={event => handleCveChange(idx, event.target.value)}></TextInput>
              </FlexItem>
              <FlexItem>
                <Button icon={<Remove2Icon />} variant="danger" aria-label="Delete CVE" onClick={_ => handleDeleteCve(idx)}>
                  
                </Button>
              </FlexItem>
            </Flex>
          </FormGroup>
        </div>
      })}
      <Flex justifyContent={{ default: 'justifyContentFlexStart' }}>
        <FlexItem>
          <Button icon={<AddCircleOIcon />} variant="primary" aria-label="Add CVE" onClick={handleAddCve}>
             Add a CVE
          </Button>
        </FlexItem>
      </Flex>
    </FormSection>
    <FormGroup label="SBOM Input Type" isRequired fieldId="sbom-type">
      <FormSelect value={sbomType} id="sbom-type" onChange={handleSbomTypeChange}>
        {sbomTypes.map((option, index) => <FormSelectOption isDisabled={option.disabled} key={index} value={option.value} label={option.label} />)}
      </FormSelect>
    </FormGroup>
    <FormGroup label="SBOM" isRequired fieldId="sbom-file">
      <FileUpload id="sbom-file" value={sbom}
        filename={filename}
        onReadStarted={handleFileReadStarted}
        onReadFinished={handleFileReadFinished}
        isLoading={isLoading}
        filenamePlaceholder="Drag and drop or upload a Syft generated CycloneDX SBOM JSON file"
        onFileInputChange={handleFileInputChange}
        onClearClick={handleClear}
        browseButtonText="Upload" />
    </FormGroup>
    <ActionGroup>
      <Button variant="primary" isDisabled={!canSubmit} onClick={onSubmitForm}>Submit</Button>
    </ActionGroup>
  </Form>

}