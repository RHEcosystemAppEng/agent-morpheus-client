import { Bullseye, Button, EmptyState, EmptyStateVariant, Flex, Label, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, Toolbar, ToolbarContent, ToolbarItem, getUniqueId} from "@patternfly/react-core";
import { listProducts, deleteProductReports} from "../services/ProductReportClient";
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { TrashIcon } from '@patternfly/react-icons/dist/esm/icons/trash-icon';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { useOutletContext, useSearchParams, Link } from "react-router-dom";
import { getMetadataColor } from "../Constants";
import { StatusLabel } from "./StatusLabel";
import JustificationBanner from "./JustificationBanner";

export default function ProductReportsTable() {

  const [searchParams, setSearchParams] = useSearchParams();

  const { addAlert } = useOutletContext();
  const [products, setProducts] = React.useState([]);
  const [activeSortDirection, setActiveSortDirection] = React.useState('desc');
  const [activeSortIndex, setActiveSortIndex] = React.useState(3); // Submitted At
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [deleteItems, setDeleteItems] = React.useState([]);
  const [deleteAll, setDeleteAll] = React.useState(false);

  const loadProducts = () => {
    listProducts().then(p => {
      setProducts(p);
    })
    .catch(e => {
    addAlert('danger', 'Unable to load products table')
    })
  }

  const onRemoveFilter = (param) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(param);
    setSearchParams(newParams);
  };

  React.useEffect(() => {
    loadProducts();
  },[]);

  const onConfirmDelete = () => {
    setModalOpen(false);
    let filter = new URLSearchParams();
    if(deleteAll) {
      filter = new URLSearchParams(searchParams);
    } else {
      deleteItems.forEach(v => filter.append("productIds", v.productId));
    }
    deleteProductReports(filter).then(() => loadProducts());
    setDeleteItems([]);
    setDeleteAll(false);
  }

  const onCloseModal = () => {
    setModalOpen(false);
  }

  const getSortParams = columnIndex => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
      const field = columnNames[index].key;
      const newParams = new URLSearchParams(searchParams);
      newParams.set("sortBy", `${field}:${direction}`);
      setSearchParams(newParams);
    },
    columnIndex
  });

  const showDeleteButton = () => deleteAll || deleteItems.length > 0;

  const onSelectOnlyItem = (productId, rowIndex) => {
    setDeleteAll(false);
    setDeleteItems([{ id: rowIndex, productId: productId }]);
  }

  const onSelectItem = (productId, rowIndex, isSelecting) => {
    if(deleteAll) {
      setDeleteAll(false);
      isSelecting = true;
    }
    var pos = rowIndex;
    if(isSelecting) {
      let idx = deleteItems.findIndex((element) => element.id === pos);
      if(idx === -1) {
        const newItems = [...deleteItems, {id: pos, productId: productId}];
        setDeleteItems(newItems);
      }
    } else {
      const newItems = deleteItems.filter((item) => item.id != pos);
      setDeleteItems(newItems);
    }
  };

  const isSelectedItem = rowIndex => {
    const pos = rowIndex;
    return deleteAll || deleteItems.findIndex((element) => element.id === pos) !== -1;
  }

  const onDeleteAll = isSelecting => {
    setDeleteAll(isSelecting);
    setDeleteItems([]);
  }

  const columnNames = [
    { key: 'id', label: 'info' },
    { key: 'productName', label: 'Product' },
    { key: 'productVersion', label: 'Version' },
    { key: 'vulns', label: 'CVEs' },
    { key: 'completedAt', label: 'Completed At' },
    { key: 'submittedAt', label: 'Submitted At' },
    { key: 'state', label: 'State' }
  ];

  const emptyTable = () => {
    return <Tr>
      <Td colSpan={6}>
        <Bullseye>
          <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No products found" variant={EmptyStateVariant.sm}>
          </EmptyState>
        </Bullseye>
      </Td>
    </Tr>;
  };

  const productsTable = () => {
    return products.map((p, rowIndex) => {
      const rowActions = [
        {
          title: 'Delete',
          onClick: () => {
            onSelectItem(p.id, rowIndex, true);
            setModalOpen(true);
          },
          isOutsideDropdown: true
        }
      ];
      return <Tr key={p.id}>
        <Td select={{
          rowIndex,
          onSelect: (_event, isSelecting) => onSelectItem(p.id, rowIndex, isSelecting),
          isSelected: isSelectedItem(rowIndex)
        }}> </Td>
        <Td dataLabel={columnNames[0].label} modifier="nowrap">
          <Link to={`/product-reports/${p.id}`} state={{ productData: p }} style={{ color: 'var(--pf-t--global--icon--color--status--info--default' }}>
            <InfoCircleIcon size="md" style={{ fontSize: '20px', width: '20px', height: '20px' }} />
          </Link>
        </Td>
        <Td dataLabel={columnNames[1].label} modifier="nowrap">{p.productName}</Td>
        <Td dataLabel={columnNames[2].label} modifier="nowrap">{p.productVersion}</Td>
        <Td dataLabel={columnNames[3].label} modifier="nowrap">
          {Object.entries(p.cves).map(([cve, justifications]) => {
            const uid = getUniqueId("div");
            return (
              <div key={uid}>
                <Link to={`/reports?vulnId=${cve}`}>
                  {cve} 
                </Link>
                {justifications.length > 0 && 
                  justifications.map((justification, index) => (
                    <JustificationBanner key={`${uid}-${index}`} justification={justification} />
                  ))
                }
              </div>
            );
          })}
        </Td>
        <Td dataLabel={columnNames[4].label} modifier="nowrap">{p.completedAt || '-'}</Td>
        <Td dataLabel={columnNames[5].label} modifier="nowrap">{p.submittedAt || '-'}</Td>
        <Td dataLabel={columnNames[6].label}><StatusLabel type={p.state} /></Td>
        <Td dataLabel="Actions">
          <Flex columnGap={{ default: 'columnGapSm' }}>
            <Button onClick={() => {
              onSelectOnlyItem(p.id, rowIndex); 
              setModalOpen(true);
            }} variant="stateful" aria-label="delete" state="attention" icon={<TrashIcon/>}/>
          </Flex>
        </Td>
      </Tr>
    });
  }

  let filterLabels = [];
  searchParams.forEach((value, key) => {
    let color = getMetadataColor(key);
    filterLabels.push(<Label color={color} onClose={() => onRemoveFilter(key)} >{key}={value}</Label>);
  });

  return <>
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem>
          {showDeleteButton() ? <Button variant="danger" onClick={setModalOpen} aria-label="delete" icon={<TrashIcon />}>Delete</Button> : ""}
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
    <Table>
      <Thead>
        <Tr>
          <Th select={{
            onSelect: (_event, isSelecting) => onDeleteAll(isSelecting),
            isSelected: deleteAll
          }} aria-label="All Selected"/>
          <Th width={5}>{columnNames[0].label}</Th>
          <Th width={20} sort={getSortParams(1)}>{columnNames[1].label}</Th>
          <Th width={10} sort={getSortParams(2)}>{columnNames[2].label}</Th>
          <Th width={10}>{columnNames[3].label}</Th>
          <Th width={10} sort={getSortParams(4)}>{columnNames[4].label}</Th>
          <Th width={10} sort={getSortParams(5)}>{columnNames[5].label}</Th>
          <Th>{columnNames[6].label}</Th>
          <Td>Actions</Td>
        </Tr>
      </Thead>
      <Tbody>
        {products.length == 0 ? emptyTable() : productsTable()}
      </Tbody>
    </Table>
    <Modal variant={ModalVariant.small} isOpen={isModalOpen}
      onClose={onCloseModal}
    >
      <ModalHeader title="Are you sure?" />
      <ModalBody>
        {deleteAll
          ? "All products and their associated reports will be permanently deleted"
          : `${deleteItems.length} ${deleteItems.length === 1 ? "product" : "products"} and their associated reports will be permanently deleted.`}
      </ModalBody>
      <ModalFooter>
        <Button key="confirm" variant="danger" onClick={onConfirmDelete}>Delete</Button>
        <Button key="close" variant="link" onClick={onCloseModal}>Close</Button>
      </ModalFooter>
    </Modal>
  </>
};