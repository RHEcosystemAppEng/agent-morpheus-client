import { Bullseye, EmptyState, EmptyStateVariant, ActionGroup, Button, FileUpload, Flex, FlexItem, Form, FormGroup, FormSection, FormSelect, FormSelectOption, TextInput, ValidatedOptions } from "@patternfly/react-core";
import { Link } from "react-router-dom";
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import Remove2Icon from '@patternfly/react-icons/dist/esm/icons/remove2-icon';
import AddCircleOIcon from '@patternfly/react-icons/dist/esm/icons/add-circle-o-icon';

import { sbomTypes } from "../services/FormUtilsClient";
import { generateMorpheusRequest } from "../services/productScanClient";
import { listProducts } from "../services/ProductReportClient";

export const ProductScanForm = ({ productVulnRequest, handleProductVulnRequestChange, onNewAlert }) => {
  const [prodName, setProdName] = React.useState('');
  const [prodVersion, setProdVersion] = React.useState('');
  const [prodId, setProdId] = React.useState('');
  const [cves, setCves] = React.useState(productVulnRequest['cves'] || [{}]);
  const [metadata, setMetadata] = React.useState(productVulnRequest['metadata'] || [{}]);
  const [sbomType, setSbomType] = React.useState(productVulnRequest['sbomType'] || 'manual');
  const [ociComponents, setOciComponents] = React.useState([]);
  const [totComponents, setTotComponents] = React.useState(0);
  const [filename, setFilename] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [canSubmit, setCanSubmit] = React.useState(false);
  const [selectedComponents, setSelectedComponents] = React.useState([]);
  const [selectAll, setSelectAll] = React.useState(true);

  React.useEffect(() => {
    if (ociComponents.length > 0) {
      const allSelected = ociComponents.map((r, i) => ({
        idx: i,
        name: r.name,
        version: r.version,
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
    const updated = productVulnRequest;

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
  }, [productVulnRequest, selectedComponents]); 

  const handleMetadataChange = (idx, field, newValue) => {
    const updatedMetadata = [...metadata];
    updatedMetadata[idx][field] = newValue;
    setMetadata(updatedMetadata);
    handleProductVulnRequestChange({ metadata: updatedMetadata });
  };

  const handleAddMetadata = () => {
    setMetadata((prevMetadata) => {
      const updatedElems = [...prevMetadata, { name: "", value: ""}];
      handleProductVulnRequestChange({ metadata: updatedElems });
      return updatedElems;
    });
  }

  const handleDeleteMetadata = idx => {
    const updatedMetadata = metadata.filter((_, i) => i !== idx);
    setMetadata(updatedMetadata);
    handleProductVulnRequestChange({ metadata: updatedMetadata });
  }

  const handleCveChange = (idx, name) => {

    setCves((prevElements) => {
      const updatedElems = prevElements.map((element, index) =>
        index === idx ? { ...element, name: name } : element
      );
      handleProductVulnRequestChange({ cves: updatedElems });
      return updatedElems;
    });
  };

  const handleAddCve = () => {
    setCves((prevCveList) => {
      const updatedElems = [
        ...prevCveList,
        { name: '' }
      ];
      handleProductVulnRequestChange({ cves: updatedElems });
      return updatedElems
    });
  }

  const handleDeleteCve = idx => {
    setCves((prevCveList) => {
      const updatedElems = prevCveList.filter((_, index) => index !== idx);
      handleProductVulnRequestChange({ cves: updatedElems });
      return updatedElems
    });
  }

  const handleSbomTypeChange = (_, type) => {
    setSbomType(type);
    handleProductVulnRequestChange({ sbomType: type });
  }

  const handleProductSbomParsing = sbom => {
    if (!sbom) return;
  
    try {
      const spdxId = sbom.SPDXID;
      const relationships = sbom.relationships || [];
      const packages = sbom.packages || [];

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
      
      setProdName(prodName);
      setProdVersion(prodVersion);
      setProdId([prodName, prodVersion].join(':'));
  
      const componentIds = relationships
        .filter(rel =>
          rel.relationshipType === "PACKAGE_OF" && rel.relatedSpdxElement === productSpdxId
        )
        .map(rel => rel.spdxElementId);

      const ociComps = [];

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

        if (reference.startsWith("pkg:oci")) {
          ociComps.push(component);
        }
      });
  
      setOciComponents(ociComps);
    } catch (error) {
      console.error("Failed to parse SBOM:", error);
    }
  };  

  const handleFileInputChange = (_, file) => {
    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      const loadedSbom = JSON.parse(e.target.result)
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
    setFilename('');
    setOciComponents([]);
    setTotComponents(0);
    setSelectedComponents([]);
    setSelectAll(false);
  };

  const onSubmitForm = async () => {
    setCanSubmit(false);

    onNewAlert('info', 'Please wait, request processing...')

    const submissionTimestamp = new Date().toISOString();
    
    const finalProductId = `${prodId}:${submissionTimestamp.replace(/[:.]/g, '-')}`;
    
    const updated = {
      ...productVulnRequest,
      metadata: [
        ...metadata,
        { name: 'product_id', value: finalProductId },
        { name: 'product_name', value: prodName },
        { name: 'product_version', value: prodVersion },
        { name: 'product_submitted_at', value: submissionTimestamp },
        { name: 'product_submitted_count', value: selectedComponents.length }
      ]
    };

    generateMorpheusRequest(selectedComponents, updated)
      .then(response => {
        if (response.ok) {
          onNewAlert('success', 'Product analysis request sent to Morpheus. For more information, please visit the ', <Link to={`/product-reports/${finalProductId}`}>Product Report</Link>);
        } else {
          response.json().then(json => onNewAlert('danger', `Unable to send request: Status code ${response.status} - ${json.error}. For more information, please visit the `, <Link to={`/product-reports/${finalProductId}`}>Product Report</Link>)); 
        }
      }).catch(error => {
        onNewAlert('danger', `Unable to send request: ${error.message}`)
      }).finally(() => setCanSubmit(true));
  }

  const columnNames = [
    { key: 'image', label: 'Component' },
    { key: 'tag', label: 'Version' },
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
          onSelect: (_event, isSelecting) => onSelectItem(r.reference, r.name, r.version, rowIndex, isSelecting),
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
        name: r.name,
        version: r.version,
        ref: r.reference,
      }));
      setSelectedComponents(allSelected);
    } else {
      setSelectedComponents([]);
    }
  };

  const onSelectItem = (ref, name, version, rowIndex, isSelecting) => {
    const idx = selectedComponents.findIndex((e) => e.idx === rowIndex);
  
    if (isSelecting && idx === -1) {
      setSelectedComponents([...selectedComponents, { idx: rowIndex, ref: ref, name: name, version: version }]);
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
      <FileUpload id="sbom-file"
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
      {totComponents > 0 && (
        <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', fontSize: '14px', color: '#856404' }}>
          <strong>Important:</strong> Product Scanning currently supports OCI type packages only. 
          Out of {totComponents} total components, {ociComponents.length} are eligible for scanning.
        </div>
      )}
      <Table style={{ border: '1px solid #ccc' }}>
        <Thead>
          {ociComponents.length === 0 ? null : componentHeaders()}
        </Thead>
        <Tbody>
          {ociComponents.length === 0 ? emptyTable() : componentsTable()}
        </Tbody>
      </Table>
    </FormGroup>
    <ActionGroup>
      <Button variant="primary" isDisabled={!canSubmit} onClick={onSubmitForm}>Submit</Button>
    </ActionGroup>
  </Form>

}