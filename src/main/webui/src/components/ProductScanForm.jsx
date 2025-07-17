import { Bullseye, EmptyState, EmptyStateVariant, ActionGroup, Button, FileUpload, Flex, FlexItem, Form, FormGroup, FormSection, FormSelect, FormSelectOption, TextInput } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import Remove2Icon from '@patternfly/react-icons/dist/esm/icons/remove2-icon';
import AddCircleOIcon from '@patternfly/react-icons/dist/esm/icons/add-circle-o-icon';

import { sbomTypes } from "../services/FormUtilsClient";
import { generateMorpheusRequest } from "../services/productScanClient";

export const ProductScanForm = ({ handleVulnRequestChange, onNewAlert }) => {
  const [prodId, setProdId] = React.useState('');
  const [defaultProdId, setDefaultProdId] = React.useState('');
  const [cves, setCves] = React.useState([{}]);
  const [metadata, setMetadata] = React.useState([{}]);
  const [sbomType, setSbomType] = React.useState('manual');
  const [prodSbom, setProdSbom] = React.useState({});
  const [ociComponents, setOciComponents] = React.useState([]);
  const [rpmComponents, setRpmComponents] = React.useState([]);
  const [noneComponents, setNoneComponents] = React.useState([]);
  const [totComponents, setTotComponents] = React.useState(0);
  const [filename, setFilename] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [canSubmit, setCanSubmit] = React.useState(false);
  const [selectedComponents, setSelectedComponents] = React.useState([]);
  const [selectAll, setSelectAll] = React.useState(true);
  const [formData, setFormData] = React.useState({});

  React.useEffect(() => {
    if (ociComponents.length > 0) {
      const allSelected = ociComponents.map((r, i) => ({
        idx: i,
        ref: r.reference,
      }));
      setSelectedComponents(allSelected);
      setSelectAll(true);
    } else {
      setSelectedComponents([]);
      setSelectAll(false);
    }
  }, [ociComponents]);

  React.useEffect(() => {
    const updated = formData;

    const updatedCves = updated['cves'];
    if (!updatedCves || updatedCves.length === 0) {
      setCanSubmit(false);
      return;
    }

    for (let value of updatedCves) {
      if (!value.name || value.name.trim() === '') {
        setCanSubmit(false);
        return;
      }
    }

    const metadata = updated['metadata'] || [];
    for (let pair of metadata) {
      if (!pair.name || pair.name.trim() === '' || !pair.value || pair.value.trim() === '') {
        setCanSubmit(false);
        return;
      }
    }

    if (selectedComponents.length === 0) {
      setCanSubmit(false);
      return;
    }

    setCanSubmit(true);
  }, [formData, selectedComponents]);

  const handleProdIdChange = (_, id) => {
    setProdId(id);
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

  const handleProductSbomParsing = sbom => {
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

      const prodPkg = packages.find(p => p.SPDXID === productSpdxId);
      
      const prodName = prodPkg?.name || sbom.name;
      const prodVersion = prodPkg?.versionInfo || sbom.spdxVersion;
      
      setDefaultProdId([prodName, prodVersion, productSpdxId].join(':'));
  
      // Step 2: Find all components related to the product with "PACKAGE_OF"
      const componentIds = relationships
        .filter(rel =>
          rel.relationshipType === "PACKAGE_OF" && rel.relatedSpdxElement === productSpdxId
        )
        .map(rel => rel.spdxElementId);

      // Step 3: Resolve componentIds into package objects and extract required fields
      const rpmComps = [];
      const ociComps = [];
      const noneComps = [];

      setTotComponents(componentIds.length);

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
  
        const reference = purlRef ? purlRef.referenceLocator : "";
        const component = { name, version, reference };

        if (reference.startsWith("pkg:rpm")) {
          rpmComps.push(component);
        } else if (
          reference.startsWith("pkg:oci") &&
          reference.includes("repository_url=registry.redhat.io/openshift4/")
        ) {
          ociComps.push(component);
        } else if (
          reference.startsWith("pkg:oci") &&
          reference.includes("repository_url=registry.redhat.io/openshift/")
        ) {
          noneComps.push(component);
        // } else {
        //   noneComps.push(component); // temp includes pkg:oci + repository_url=registry.redhat.io/openshift/ filter instead of no match
        }
      });
  
      // Step 4: Set components
      setOciComponents(ociComps);
      setRpmComponents(rpmComps);
      setNoneComponents(noneComps);
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

  const handleClear = () => {
    setProdSbom({});
    setFilename('');
    setOciComponents([]);
    setRpmComponents([]);
    setNoneComponents([]);
    setTotComponents(0);
    setSelectedComponents([]);
    setSelectAll(false);
  };

  const onSubmitForm = async () => {
    setCanSubmit(false);

    onNewAlert('info', 'Please wait, request processing...')

    const prodIdEntry = { name: 'product_id', value: prodId || defaultProdId };
    const updatedMetadata = [...metadata, prodIdEntry];
    setMetadata(updatedMetadata);

    const update = { metadata: updatedMetadata };
    const updated = handleVulnRequestChange(update);

    const failures = await generateMorpheusRequest(selectedComponents, updated);
  
    if (failures.length) {
      onNewAlert('danger', 'Failures occurred while submitting request')
      console.log("FAILURES", failures)
    } else {
      onNewAlert('success', 'Analysis request sent to Morpheus');
    }

    setCanSubmit(true);
  }


  const onFormUpdated = update => {
    if (!update) {
      setFormData({});
      return;
    }
  
    const updated = handleVulnRequestChange(update);
    setFormData(updated);
  };

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

  const componentHeaders = () => {
    return <Tr>
      <Th select={{
        onSelect: (_event, isSelecting) => onSelectAll(isSelecting),
        isSelected: selectAll
      }} aria-label="All Selected"/>
      <Th width={10}>{columnNames[0].label}</Th>
      <Th width={10}>{columnNames[1].label}</Th>
    </Tr>;
  };

  const componentsTable = () => {
    return ociComponents.map((r, rowIndex) => {
      return <Tr key={r.reference}>
        <Td select={{
          rowIndex,
          onSelect: (_event, isSelecting) => onSelectItem(r.reference, rowIndex, isSelecting),
          isSelected: isSelectedItem(rowIndex)
        }}> </Td>
        <Td dataLabel={columnNames[0].label} modifier="nowrap">{r.name}</Td>
        <Td dataLabel={columnNames[1].label} modifier="nowrap">{r.version}</Td>
      </Tr>
    });
  } 

  const onSelectAll = isSelecting => {
    setSelectAll(isSelecting);

    if (isSelecting) {
      const allSelected = ociComponents.map((r, i) => ({
        idx: i,
        ref: r.reference,
      }));
      setSelectedComponents(allSelected);
    } else {
      setSelectedComponents([]);
    }
  };

  const onSelectItem = (ref, rowIndex, isSelecting) => {
    const idx = selectedComponents.findIndex((e) => e.idx === rowIndex);
  
    if (isSelecting && idx === -1) {
      setSelectedComponents([...selectedComponents, { idx: rowIndex, ref: ref }]);
    } else if (!isSelecting && idx !== -1) {
      const newItems = selectedComponents.filter((item) => item.idx !== rowIndex);
      setSelectedComponents(newItems);
      setSelectAll(false);
    }
  
    if (isSelecting) {
      const total = ociComponents.length;
      if (selectedComponents.length + 1 === total) {
        setSelectAll(true);
      }
    }
  };

  const isSelectedItem = rowIndex => {
    return selectedComponents.findIndex((e) => e.idx === rowIndex) !== -1;
  };

  return <Form isHorizontal>
    <FormGroup label="Request ID" fieldId="req-id">
      <TextInput type="text" id="req-id" value={prodId} onChange={handleProdIdChange} placeholder="Leave blank and will be generated" autoComplete="off"></TextInput>
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
          {ociComponents.length === 0 ? null : componentHeaders()}
        </Thead>
        <Tbody>
          {ociComponents.length === 0 ? emptyTable() : componentsTable()}
        </Tbody>
      </Table>
      <div style={{ color: 'red' }}>
        <div>Total Component Count: {totComponents}</div>
        <div>RPM Component Count: {rpmComponents.length}</div>
        <div>OCI Component (OCP) Count: {noneComponents.length}</div>
        <div>OCI Component (OCP4) Count: {ociComponents.length}</div>
      </div>
    </FormGroup>
    <ActionGroup>
      <Button variant="primary" isDisabled={!canSubmit} onClick={onSubmitForm}>Submit</Button>
    </ActionGroup>
  </Form>

}