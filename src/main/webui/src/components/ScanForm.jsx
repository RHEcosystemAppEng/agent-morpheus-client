import { FileUpload, Form, FormGroup, FormSelect, FormSelectOption, TextInput } from "@patternfly/react-core";
import { ProgrammingLanguagesSelect } from "./ProgrammingLanguagesSelect";
import { GetGitHubLanguages } from "../services/FormUtilsClient";

export const ScanForm = ({vulnRequest, handleVulnRequestChange}) => {
  const [id, setId] = React.useState(vulnRequest['id'] || '');
  const [cves, setCves] = React.useState(vulnRequest['cves'] || '');
  const [sbom, setSbom] = React.useState(vulnRequest['sbom'] || {});
  const [sbomType, setSbomType] = React.useState(vulnRequest['sbomType'] || 'csv');
  const [filename, setFilename] = React.useState(vulnRequest['filename'] || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [languages, setLanguages] = React.useState(vulnRequest['languages'] || []);

  const handleIdChange = (_, id) => {
    setId(id);
    handleVulnRequestChange({id: id})
  };
  const handleCvesChange = (_, cves) => {
    setCves(cves);
    handleVulnRequestChange({cves: cves})
  };
  const getMetadataProperty = (metadata, property) => {
    const found = metadata['properties'].find(e => e.name === property);
    if (found) {
      return found.value;
    }
    return '';
  };
  const getComponents = (components) => {
    return components.map(component => (
      JSON.stringify({
        name: component['name'],
        version: component['version'],
        purl: component['purl']
      })));
  };

  const handleFileInputChange = (_, file) => {
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      const loadedSbom =  JSON.parse(e.target.result)
      setSbom(loadedSbom);
      const metadata = loadedSbom['metadata']
      const component = metadata['component']
      const commitUrl = getMetadataProperty(metadata, "syft:image:labels:io.openshift.build.commit.url");
      const repository = getMetadataProperty(metadata, "syft:image:labels:io.openshift.build.source-location");
      const commitRef = commitUrl.substring(commitUrl.lastIndexOf('/') + 1);
      const name = component['name'];
      const version = component['version'];

      var newId = id;
      if(id === '') {
        var suffix = version;
        if (suffix.startsWith('sha256')) {
          suffix = suffix.substring(0, 16);
        }
        newId = `${name}:${suffix}`;
        newId = newId.substring(newId.indexOf('/') + 1).replace('/', '_');
        setId(newId);
      }
      GetGitHubLanguages(repository).then(ghLanguages => {
        setLanguages(ghLanguages);
        handleVulnRequestChange({
          id: newId,
          name: name,
          version: version,
          repository: repository,
          commitRef: commitRef,
          components: getComponents(loadedSbom['components']),
          languages: ghLanguages
        });
      });

    }
    setFilename(file.name);
  }
  const handleSbomTypeChange = (_, type) => {
    setSbomType(type);
    handleVulnRequestChange({sbomType: type});
  }
  const handleFileReadStarted = (_event, _fileHandle) => {
    setIsLoading(true);
  };
  const handleFileReadFinished = (_event, _fileHandle) => {
    setIsLoading(false);
  };
  const handleLanguagesChange = (languages) => {
    setLanguages(languages)
    handleVulnRequestChange({languages: languages})
  }

  const handleClear = _ => {
    setFilename('');
    setSbom('');
    handleVulnRequestChange({
      name: '',
      version: '',
      repository: '',
      commitRef: '',
      components: '',
    });
  }

  const sbomTypes = [{
    value: 'csv',
    label: 'CSV',
    disabled: false
  },
  {
    value: 'spdx+json',
    label: 'SPDX (JSON)',
    disabled: false
  }
  ]

  return <Form isHorizontal>
    <FormGroup label="Request ID" isRequired fieldId="req-id">
      <TextInput isRequired type="text" id="req-id" value={id} onChange={handleIdChange} placeholder="Leave blank and will be generated from the SBOM data" autoComplete="off"></TextInput>
    </FormGroup>
    <FormGroup label="CVEs" isRequired fieldId="cves">
      <TextInput isRequired type="text" id="cves" value={cves} onChange={handleCvesChange}></TextInput>
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
        filenamePlaceholder="Drag and drop or upload a SPDX SBOM JSON file"
        onFileInputChange={handleFileInputChange}
        onClearClick={handleClear}
        browseButtonText="Upload" />
    </FormGroup>
    <FormGroup label="Programming Languages" isRequired fieldId="languages">
      <ProgrammingLanguagesSelect selected={languages} handleSelectedChange={handleLanguagesChange} />
    </FormGroup>
  </Form>

}