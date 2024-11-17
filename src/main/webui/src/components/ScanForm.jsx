import { ActionGroup, Button, FileUpload, Flex, FlexItem, Form, FormGroup, FormSection, FormSelect, FormSelectOption, TextInput, getUniqueId } from "@patternfly/react-core";
import { ProgrammingLanguagesSelect } from "./ProgrammingLanguagesSelect";
import Remove2Icon from '@patternfly/react-icons/dist/esm/icons/remove2-icon';
import AddCircleOIcon from '@patternfly/react-icons/dist/esm/icons/add-circle-o-icon';

import { getGitHubLanguages, sendToMorpheus, sbomTypes, getProperty } from "../services/FormUtilsClient";
import {productNames} from "../Constants.js";

export const ScanForm = ({ vulnRequest, handleVulnRequestChange, onNewAlert }) => {
  const [id, setId] = React.useState(vulnRequest['id'] || '');
  const [cves, setCves] = React.useState(vulnRequest['cves'] || [{}]);
  const [sbom, setSbom] = React.useState(vulnRequest['sbom'] || {});
  const [sbomType, setSbomType] = React.useState(vulnRequest['sbomType'] || 'csv');
  const [product, setProduct] = React.useState(vulnRequest['product'] || '');
  const [filename, setFilename] = React.useState(vulnRequest['filename'] || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [languages, setLanguages] = React.useState(vulnRequest['languages'] || []);
  const [canSubmit, setCanSubmit] = React.useState(false);

  const handleIdChange = (_, id) => {
    setId(id);
    onFormUpdated({ id: id })
  };

  const handleCveNameChange = (idx, name) => {
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
      const metadata = loadedSbom['metadata']
      const component = metadata['component']
      const commitUrl = getProperty(metadata, "syft:image:labels:io.openshift.build.commit.url");
      const repository = getProperty(metadata, "syft:image:labels:io.openshift.build.source-location");
      const commitRef = commitUrl.substring(commitUrl.lastIndexOf('/') + 1);
      const name = component['name'];
      const version = component['version'];

      var newId = id;
      if (id === '') {
        var suffix = version;
        if (suffix.startsWith('sha256')) {
          suffix = suffix.substring(0, 16);
        }
        newId = `${name}:${suffix}`;
        newId = newId.substring(newId.indexOf('/') + 1).replace('/', '_');
        setId(newId);
      }
      getGitHubLanguages(repository).then(ghLanguages => {
        setLanguages(ghLanguages);
        onFormUpdated({
          id: newId,
          name: name,
          version: version,
          repository: repository,
          commitRef: commitRef,
          languages: ghLanguages,
          sbom: loadedSbom
        });
      });

    }
    setFilename(file.name);
  }
  const handleSbomTypeChange = (_, type) => {
    setSbomType(type);
    onFormUpdated({ sbomType: type });
  }
    const handleProductChange = (_, product) => {
    setProduct(product);
    onFormUpdated({ product: product });
  }

  const handleFileReadStarted = (_event, _fileHandle) => {
    setIsLoading(true);
  };
  const handleFileReadFinished = (_event, _fileHandle) => {
    setIsLoading(false);
  };
  const handleLanguagesChange = (languages) => {
    setLanguages(languages)
    onFormUpdated({ languages: languages })
  }

  const handleClear = _ => {
    setFilename('');
    setSbom('');
    onFormUpdated({
      name: '',
      version: '',
      repository: '',
      commitRef: '',
      components: ''
    });
  }

  const onSubmitForm = () => {
    setCanSubmit(false);
    sendToMorpheus(vulnRequest)
      .then(response => {
        if (response.ok) {
          onNewAlert('success', 'Analysis request sent to Morpheus');
        } else {
          onNewAlert('danger', `Unable to send request: ${response.status}:${response.statusText}`)
        }
      }).catch(error => {
        onNewAlert('danger', `Unable to send request: ${error}`)
      }).finally(() => setCanSubmit(true));
  }

  const REQUIRED_FIELDS = ['name', 'version', 'id', 'commitRef', 'repository']

  const onFormUpdated = (update) => {
    const updated = handleVulnRequestChange(update);
    for (let f in REQUIRED_FIELDS) {
      if (updated[REQUIRED_FIELDS[f]] === undefined || updated[REQUIRED_FIELDS[f]].trim() === '') {
        setCanSubmit(false);
        handleVulnRequestChange(update);
        return;
      }
    };
    const updatedCves = updated['cves']
    if (updatedCves === undefined || updatedCves.length === 0) {
      setCanSubmit(false);
      handleVulnRequestChange(update);
      return;
    }
    for (let cve of updatedCves) {
      if (cve.name === undefined || cve.name.trim() === '') {
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
    <FormGroup label="Request ID" isRequired fieldId="req-id">
      <TextInput isRequired type="text" id="req-id" value={id} onChange={handleIdChange} placeholder="Leave blank and will be generated from the SBOM data" autoComplete="off"></TextInput>
    </FormGroup>
    <FormSection title="CVEs">
      {cves.map((cve, idx) => {
        const uid = getUniqueId();
        return <div key={uid}>
          <FormGroup label="CVE" isRequired fieldId={`cve_${idx}_name`}>
            <Flex>
              <FlexItem>
                <TextInput isRequired type="text" id={`cve_${idx}_name`} value={cve.name} onChange={event => handleCveNameChange(idx, event.target.value)}></TextInput>
              </FlexItem>
              <FlexItem>
                <Button variant="danger" aria-label="Delete CVE" onClick={_ => handleDeleteCve(idx)}>
                  <Remove2Icon />
                </Button>
              </FlexItem>
            </Flex>
          </FormGroup>
        </div>
      })}
      <Flex justifyContent={{ default: 'justifyContentFlexStart' }}>
        <FlexItem>
          <Button variant="primary" aria-label="Delete CVE" onClick={handleAddCve}>
            <AddCircleOIcon /> Add a CVE
          </Button>
        </FlexItem>
      </Flex>
    </FormSection>
    <FormGroup label="Product Name" isRequired fieldId="product-name">
      <FormSelect value={product} id="product-name" onChange={handleProductChange}>
        {productNames.map((option, index) => <FormSelectOption isDisabled={option.disabled} key={index} value={ option.product_name } label={option.product_name} />)}
      </FormSelect>
    </FormGroup>
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
    <FormGroup label="Programming Languages" isRequired fieldId="languages">
      <ProgrammingLanguagesSelect selected={languages} handleSelectedChange={handleLanguagesChange} />
    </FormGroup>
    <ActionGroup>
      <Button variant="primary" isDisabled={!canSubmit} onClick={onSubmitForm}>Submit</Button>
    </ActionGroup>
  </Form>

}