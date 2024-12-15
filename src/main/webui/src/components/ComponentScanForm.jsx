import { ActionGroup, Button, Flex, FlexItem, Form, FormSection, FormGroup, FormSelect, FormSelectOption, TextInput } from "@patternfly/react-core";
import { Checkbox, Bullseye, EmptyState, EmptyStateHeader, EmptyStateIcon, EmptyStateVariant } from "@patternfly/react-core";
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import Remove2Icon from '@patternfly/react-icons/dist/esm/icons/remove2-icon';
import AddCircleOIcon from '@patternfly/react-icons/dist/esm/icons/add-circle-o-icon';

import { sendToMorpheus } from "../services/FormUtilsClient";

export const ComponentScanForm = ({ vulnRequest, handleVulnRequestChange, onNewAlert }) => {
  const [cves, setCves] = React.useState(vulnRequest['cves'] || [{}]);
  const [canSubmit, setCanSubmit] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState('');
  const [products, setProducs] = React.useState([]);
  const [components, setComponents] = React.useState([]);
  const [selectedComponents, setSelectedComponents] = React.useState([]);

  // Simulate fetching data from a database or API
  React.useEffect(() => {
    const fetchProducts = async () => {
      const dataFromDb = [
        { value: '', label: 'Select a product', disabled: true },
        { value: 'prod1', label: 'Product 1', disabled: false },
        { value: 'prod2', label: 'Product 2', disabled: false },
        { value: 'prod3', label: 'Product 3', disabled: false }
      ];
      setProducs(dataFromDb);
    };

    fetchProducts();
  }, []);

  React.useEffect(() => {
    const hasValidCves = cves.some(cve => Object.keys(cve).length > 0);

    setCanSubmit(selectedComponents.length > 0 && hasValidCves);
  }, [selectedComponents, cves]);

  const toggleSelect = (id) => {
    setSelectedComponents((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(item => item !== id); // deselect
      } else {
        return [...prevSelected, id]; // select
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedComponents.length === components.length) {
      setSelectedComponents([]); // Deselect all if all are selected
    } else {
      setSelectedComponents(components.map(c => c.id)); // Select all
    }
  };

  const loadComponents = async () => {
    const dataFromDb = [
      { id: 'comp1', name: 'component 1', version: '1.0.1'},
      { id: 'comp2', name: 'component 2', version: '1.0.2'},
      { id: 'comp3', name: 'component 3', version: '1.0.3'}
    ];
    if (selectedComponents) {
      setSelectedComponents([]);
    } 
    setComponents(dataFromDb);
  };


  const onChangeSelectedProduct = (_event, value) => {
    setSelectedProduct(value);
    loadComponents();
  };

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

  const columnNames = [
    { key: 'name', label: 'Component Name' },
    { key: 'version', label: 'Component Version' }
  ];

  const emptyTable = () => {
    return <Tr>
      <Td colSpan={6}>
        <Bullseye>
          <EmptyState variant={EmptyStateVariant.sm}>
            <EmptyStateHeader icon={<EmptyStateIcon icon={SearchIcon} />} titleText="No components found" headingLevel="h2" />
          </EmptyState>
        </Bullseye>
      </Td>
    </Tr>;
  }
  
  const componentsTable = () => {
    return components.map(c => {
      return <Tr key={c.id}>
        <Td>
          <Checkbox
            isChecked={selectedComponents.includes(c.id)}
            onChange={() => toggleSelect(c.id)}
          />
        </Td>
        <Td dataLabel={columnNames[0].label} modifier="truncate">{c.name}</Td>
        <Td dataLabel={columnNames[1].label} modifier="truncate">{c.version}</Td>
      </Tr>
    });
  }

  return <Form isHorizontal>
    <FormSection title="List CVEs For Evaluation">
      {cves.map((cve, idx) => {
        return <div key={`cve_${idx}_group`}>
          <FormGroup label="CVE" isRequired fieldId={`cve_${idx}_name`}>
            <Flex>
              <FlexItem>
                <TextInput isRequired type="text" id={`cve_${idx}_name`} value={cve.name || ""} onChange={event => handleCveChange(idx, event.target.value)}></TextInput>
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
    <FormSection title="Choose A Product">
      <FormGroup label="Product (Name - Version)" isRequired fieldId="prod-name-ver">
        <FormSelect 
          value={selectedProduct} 
          onChange={onChangeSelectedProduct} 
          aria-label="FormSelect Input" 
          ouiaId="BasicFormSelect"
        >
          {products.map((product, index) => (
            <FormSelectOption isDisabled={product.disabled} key={index} value={product.value} label={product.label} />
          ))}
        </FormSelect>
      </FormGroup>
    </FormSection>
    <FormSection title="Select Components For Analysis">
      <Table>
        <Thead>
          <Tr>
          <Th width={10}>
            <Checkbox
              aria-label="Select all"
              isChecked={selectedComponents.length === components.length & selectedComponents.length > 0}
              onChange={toggleSelectAll}
            />
          </Th>
          <Th width={45}>{columnNames[0].label}</Th>
          <Th width={45}>{columnNames[1].label}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {components.length == 0 ? emptyTable() : componentsTable()}
        </Tbody>
      </Table>
    </FormSection>
    <ActionGroup>
      <Button variant="primary" isDisabled={!canSubmit} onClick={onSubmitForm}>Start Analysis</Button>
    </ActionGroup>
  </Form>
}
