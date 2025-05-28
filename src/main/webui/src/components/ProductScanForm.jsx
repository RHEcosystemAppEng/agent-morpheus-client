import { Bullseye, EmptyState, EmptyStateVariant, ActionGroup, Button, FileUpload, Flex, FlexItem, Form, FormGroup, FormSection, FormSelect, FormSelectOption, TextInput } from "@patternfly/react-core";
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import Remove2Icon from '@patternfly/react-icons/dist/esm/icons/remove2-icon';
import AddCircleOIcon from '@patternfly/react-icons/dist/esm/icons/add-circle-o-icon';

import { sendToMorpheus, sbomTypes } from "../services/FormUtilsClient";

export const ProductScanForm = ({ vulnRequest, handleVulnRequestChange, onNewAlert }) => {
  const [prodId, setProdId] = React.useState('');
  const [cves, setCves] = React.useState([{}]);
  const [metadata, setMetadata] = React.useState([{}]);
  const [sbomType, setSbomType] = React.useState('manual');
  const [prodSbom, setProdSbom] = React.useState({});
  const [ociComponents, setOciComponents] = React.useState([]);
  const [rpmComponents, setRpmComponents] = React.useState([]);
  const [sboms, setSboms] = React.useState([]);
  const [filename, setFilename] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [canSubmit, setCanSubmit] = React.useState(false);

  const handleIdChange = (_, id) => {
    setProdId(id);
    onFormUpdated({ id: id })
  };

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

  const handleSbomTypeChange = (_, type) => {
    setSbomType(type);
    onFormUpdated({ sbomType: type });
  }

  const handleImageExtraction = (ref) => {
    const queryString = ref.split('?')[1];
    if (!queryString) return null;
  
    const params = new URLSearchParams(queryString);
    const repositoryUrl = params.get("repository_url");
    const tag = params.get("tag");
  
    if (repositoryUrl && tag) {
      return `${repositoryUrl}:${tag}`;
    }
  
    return null;
  };  

  const generateSbomFromImage = async (imageName) => {
    try {
      const response = await fetch('/generate-sbom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageName })
      });
  
      if (!response.ok) {
        throw new Error("Failed to generate SBOM");
      }
  
      const sbom = await response.json();
      setSboms(prev => [...prev, sbom]);
      console.log("Generated SBOM:", sbom);
      // Now you can pass this SBOM to your parsing function
    } catch (error) {
      console.error("Error generating SBOM:", error);
    }
  };

  const generateComponentSboms = async (comps) => {
    // for (const comp of comps) {
    //   const imageName = handleImageExtraction(comp.referenceLocator);
    //   if (imageName) {
    //     await generateSbomFromImage(imageName);
    //   } else {
    //     console.warn("Invalid package manager referenceLocator format:", comp.referenceLocator);
    //   }
    // }
    const imageName = handleImageExtraction(comps[0].referenceLocator);
    if (imageName) {
      await generateSbomFromImage(imageName);
    } else {
      console.warn("Invalid package manager referenceLocator format:", comp.referenceLocator);
    }
  };

  const handleProductSbomParsing = (sbom) => {
    if (!sbom) return;
  
    try {
      const spdxId = sbom.SPDXID;
      const relationships = sbom.relationships || [];
      const packages = sbom.packages || [];

      // Step 1: Find the "DESCRIBES" relationship for the main document
      const describesRel = relationships.find(rel =>
        rel.relationshipType === "DESCRIBES" && rel.spdxElementId === spdxId
      );
  
      if (!describesRel) {
        console.warn("No DESCRIBES relationship found.");
        return;
      }
      
      const productSpdxId = describesRel.relatedSpdxElement;
  
      // Step 2: Find all components related to the product with "PACKAGE_OF"
      const componentIds = relationships
        .filter(rel =>
          rel.relationshipType === "PACKAGE_OF" && rel.relatedSpdxElement === productSpdxId
        )
        .map(rel => rel.spdxElementId);

      // Step 3: Resolve componentIds into package objects and extract required fields
      const rpmComps = [];
      const ociComps = [];

      componentIds.forEach(spdxElementId => {
        const pkg = packages.find(p => p.SPDXID === spdxElementId);
        if (!pkg) return;
  
        const name = pkg.name || "";
        const version = pkg.versionInfo || "";
  
        const purlRef = (pkg.externalRefs || []).find(
          ref =>
            ref.referenceCategory === "PACKAGE_MANAGER" &&
            ref.referenceType === "purl"
        );
  
        const referenceLocator = purlRef ? purlRef.referenceLocator : "";
        const component = { name, version, referenceLocator };

        if (referenceLocator.startsWith("pkg:rpm")) {
          rpmComps.push(component);
        } else if (referenceLocator.startsWith("pkg:oci")) {
          ociComps.push(component);
        }
      });
  
      // Step 4: Set components
      setOciComponents(ociComps);
      setRpmComponents(rpmComps);
    } catch (error) {
      console.error("Failed to parse SBOM:", error);
    }
  };  

  const handleFileInputChange = (_, file) => {
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      const loadedSbom = JSON.parse(e.target.result)
      setProdSbom(loadedSbom);
      setFilename(file.name);
      handleProductSbomParsing(loadedSbom);
    }
  }

  const handleFileReadStarted = (_event, _fileHandle) => {
    setIsLoading(true);
  };

  const handleFileReadFinished = (_event, _fileHandle) => {
    setIsLoading(false);
  };

  const handleClear = _ => {
    setFilename('');
    setSboms('');
    setProdSbom({});
    setOciComponents([]);
    setRpmComponents([]);
    onFormUpdated();
  }

  const onSubmitForm = () => {
    setCanSubmit(false);
    sendToMorpheus(vulnRequest)
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
    
    const metadata = updated['metadata'];
    for (let idx in metadata) {
      const pair = metadata[idx];
      if (pair.name === undefined || pair.name.trim() === '' || pair.value === undefined || pair.value.trim() === '') {
        setCanSubmit(false);
        handleVulnRequestChange(update);
        return;
      }
    }

    if (sboms.length == 0) {
      setCanSubmit(false);
    } else {
      setCanSubmit(true);
    }
  }

  const columnNames = [
    { key: 'image', label: 'Component' },
    { key: 'version', label: 'Version' },
  ];
  
  const emptyTable = () => {
    return <Tr>
      <Td colSpan={6}>
        <Bullseye>
          <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No Product Components Found" variant={EmptyStateVariant.sm}>
          </EmptyState>
        </Bullseye>
      </Td>
    </Tr>;
  };

  const componentsTable = () => {
    return ociComponents.map((comp, compIndex) => {
      return <Tr key={comp.referenceLocator}>
        <Td dataLabel={columnNames[0].label} modifier="nowrap">{comp.name}</Td>
        <Td dataLabel={columnNames[1].label} modifier="nowrap">{comp.version}</Td>
      </Tr>
    });
  }

  return <Form isHorizontal>
    <FormGroup label="Request ID" fieldId="req-id">
      <TextInput type="text" id="req-id" value={prodId} onChange={handleIdChange} placeholder="Leave blank and will be generated" autoComplete="off"></TextInput>
    </FormGroup>
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
      <FileUpload id="sbom-file" value={prodSbom}
        filename={filename}
        onReadStarted={handleFileReadStarted}
        onReadFinished={handleFileReadFinished}
        isLoading={isLoading}
        filenamePlaceholder="Drag and drop or upload a Syft generated CycloneDX SBOM JSON file"
        onFileInputChange={handleFileInputChange}
        onClearClick={handleClear}
        browseButtonText="Upload" />
    </FormGroup>
    <FormGroup label="Components" fieldId="components">
      <Table style={{ border: '1px solid #ccc' }}>
        <Thead>
          <Tr>
            {/* <Th select={{
              onSelect: (_event, isSelecting) => onDeleteAll(isSelecting),
              isSelected: deleteAll
            }} aria-label="All Selected"/> */}
            <Th width={10}>{columnNames[0].label}</Th>
            <Th width={10}>{columnNames[1].label}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {ociComponents.length == 0 ? emptyTable() : componentsTable()}
        </Tbody>
      </Table>
    </FormGroup>
    <ActionGroup>
      <Button variant="primary" isDisabled={!canSubmit} onClick={onSubmitForm}>Submit</Button>
    </ActionGroup>
  </Form>

}