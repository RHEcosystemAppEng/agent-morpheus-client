import { ActionGroup, AlertGroup, Button, FileUpload, Form, FormGroup, FormSelect, FormSelectOption, TextInput } from "@patternfly/react-core";
import { ProgrammingLanguagesSelect } from "./ProgrammingLanguagesSelect";
import { GetGitHubLanguages, SendToMorpheus } from "../services/FormUtilsClient";
import { ToastNotifications } from "./Notifications";

export const ScanForm = ({ vulnRequest, handleVulnRequestChange }) => {
  const [id, setId] = React.useState(vulnRequest['id'] || '');
  const [cves, setCves] = React.useState(vulnRequest['cves'] || '');
  const [sbom, setSbom] = React.useState(vulnRequest['sbom'] || {});
  const [sbomType, setSbomType] = React.useState(vulnRequest['sbomType'] || 'csv');
  const [filename, setFilename] = React.useState(vulnRequest['filename'] || '');
  const [isLoading, setIsLoading] = React.useState(false);
  const [languages, setLanguages] = React.useState(vulnRequest['languages'] || []);
  const [canSubmit, setCanSubmit] = React.useState(false);
  const [alerts, setAlerts] = React.useState([]);

  const addAlert = (variant, title) => {
    alerts.push({ title: title, variant: variant });
    setAlerts(alerts);
  }

  const onDeleteAlert = deletePos => {
    const newAlerts = [];
    alerts.forEach((alert, idx) => {
      if (idx !== deletePos) {
        newAlerts.push(alert);
      }
    })
    setAlerts(newAlerts);
  }

  const handleIdChange = (_, id) => {
    setId(id);
    onFormUpdated({ id: id })
  };
  const handleCvesChange = (_, cves) => {
    setCves(cves);
    onFormUpdated({ cves: cves })
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
      const loadedSbom = JSON.parse(e.target.result)
      setSbom(loadedSbom);
      const metadata = loadedSbom['metadata']
      const component = metadata['component']
      const commitUrl = getMetadataProperty(metadata, "syft:image:labels:io.openshift.build.commit.url");
      const repository = getMetadataProperty(metadata, "syft:image:labels:io.openshift.build.source-location");
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
      GetGitHubLanguages(repository).then(ghLanguages => {
        setLanguages(ghLanguages);
        onFormUpdated({
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
    onFormUpdated({ sbomType: type });
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
      components: '',
    });
  }

  const onSubmitForm = () => {
    setCanSubmit(false);
    SendToMorpheus(vulnRequest).then(response => {
      if (response.ok) {
        addAlert('success', 'Analysis request sent to Morpheus');
      } else {
        addAlert('danger', `Unable to send request: ${response.status}:${response.statusText}`)
      }
    }).catch(error => {
      addAlert('danger', `Unable to send request: ${error}`)
    }).finally(() => setCanSubmit(true));
  }

  const REQUIRED_FIELDS = ['name', 'version', 'id', 'cves', 'commitRef', 'repository']

  const onFormUpdated = (update) => {
    const updated = handleVulnRequestChange(update);
    for(let f in REQUIRED_FIELDS) {
      if (updated[REQUIRED_FIELDS[f]] === undefined || updated[REQUIRED_FIELDS[f]].trim() === '') {
        setCanSubmit(false);
        handleVulnRequestChange(update);
        return;
      }
    };
    if (updated.components === undefined || updated.components.length === 0) {
      setCanSubmit(false);
    } else {
      setCanSubmit(true);
    }
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
    <ActionGroup>
      <Button variant="primary" isDisabled={!canSubmit} onClick={onSubmitForm}>Submit</Button>
      <ToastNotifications alerts={alerts} onDeleteAlert={onDeleteAlert} />
    </ActionGroup>
  </Form>

}