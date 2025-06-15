import { Bullseye, Button, EmptyState, EmptyStateVariant, Flex, Label, MenuToggle, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, Pagination, Select, SelectOption, Toolbar, ToolbarContent, ToolbarItem, Tooltip, getUniqueId } from "@patternfly/react-core";
import { deleteReports, listReports, retryReport } from "../services/ReportClient";
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { TrashIcon } from '@patternfly/react-icons/dist/esm/icons/trash-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import { RedoIcon } from '@patternfly/react-icons/dist/esm/icons/redo-icon';
import { useOutletContext, useSearchParams, Link } from "react-router-dom";
import JustificationBanner from "./JustificationBanner";
import { StatusLabel } from "./StatusLabel";
import { getMetadataColor } from "../Constants";

export default function ReportsTable() {

  const [searchParams, setSearchParams] = useSearchParams();

  const { addAlert } = useOutletContext();
  const [reports, setReports] = React.useState([]);
  const [activeSortDirection, setActiveSortDirection] = React.useState('desc');
  const [activeSortIndex, setActiveSortIndex] = React.useState(3); // Submitted At
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);
  const [totalElements, setTotalElements] = React.useState(0);
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [statusIsExpanded, setStatusIsExpanded] = React.useState(false);
  const [statusSelected, setStatusSelected] = React.useState('');
  const [deleteItems, setDeleteItems] = React.useState([]);
  const [deleteAll, setDeleteAll] = React.useState(false);

  const onSetPage = (_event, newPage) => {
    setPage(newPage);
  }
  const onPerPageSelect = (_event, newPerPage, newPage) => {
    setPerPage(newPerPage);
    setPage(newPage);
  }

  const loadReports = () => {
    listReports(searchParams, page, perPage).then(d => {
      setReports(d.reports);
      setTotalElements(d.totalElements);
    })
      .catch(e => {
        addAlert('danger', 'Unable to load reports table')
      })
  }

  const onRemoveFilter = (param) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(param);
    setSearchParams(newParams);
  };

  const onStatusToggle = () => {
    setStatusIsExpanded(!statusIsExpanded);
  }

  const onStatusSelect = (_event, selection) => {
    setStatusSelected(selection);
    setStatusIsExpanded(false);
    const newParams = new URLSearchParams(searchParams);
    if(selection === 'any') {
      newParams.delete("status");
      setSearchParams(newParams);
    } else {
      newParams.set("status", selection);
      setSearchParams(newParams);
    }
  } 

  React.useEffect(() => {
    setStatusSelected(searchParams.get('status') || 'any');
    loadReports();
  }, [searchParams, page, perPage]);

  const onConfirmDelete = () => {
    setModalOpen(false);
    let filter = new URLSearchParams();
    if(deleteAll) {
      filter = new URLSearchParams(searchParams);
    } else {
      deleteItems.forEach(v => filter.append("reportIds", v.reportId));
    }
    deleteReports(filter).then(() => loadReports());
    setDeleteItems([]);
    setDeleteAll(false);
  }

  const onCloseModal = () => {
    setModalOpen(false);
  }

  const onRetry = (id) => {
    retryReport(id).then(() => loadReports());
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

  const getAbsoluteIndex = rowIndex => {
    return rowIndex + (page * perPage);
  }

  const onSelectOnlyItem = (reportId, rowIndex) => {
    setDeleteAll(false);
    setDeleteItems([{ id: getAbsoluteIndex(rowIndex), reportId: reportId }]);
  }

  const onSelectItem = (reportId, rowIndex, isSelecting) => {
    if(deleteAll) {
      setDeleteAll(false);
      isSelecting = true;
    }
    var pos = getAbsoluteIndex(rowIndex);
    if(isSelecting) {
      let idx = deleteItems.findIndex((element) => element.id === pos);
      if(idx === -1) {
        const newItems = [...deleteItems, {id: pos, reportId: reportId}];
        setDeleteItems(newItems);
      }
    } else {
      const newItems = deleteItems.filter((item) => item.id != pos);
      setDeleteItems(newItems);
    }
  };

  const isSelectedItem = rowIndex => {
    const pos = getAbsoluteIndex(rowIndex);
    return deleteAll || deleteItems.findIndex((element) => element.id === pos) !== -1;
  }

  const onDeleteAll = isSelecting => {
    setDeleteAll(isSelecting);
    setDeleteItems([]);
  }

  const statusFilter = {
    any: "Any",
    completed: "Completed",
    expired: "Expired",
    failed: "Failed",
    queued: "Queued",
    sent: "Sent",
    pending: "Pending"
  };

  const columnNames = [
    { key: 'name', label: 'ID' },
    { key: 'vulns', label: 'CVEs' },
    { key: 'completedAt', label: 'Completed At' },
    { key: 'submittedAt', label: 'Submitted At' },
    { key: 'state', label: 'State' }
  ];

  const emptyTable = () => {
    return <Tr>
      <Td colSpan={6}>
        <Bullseye>
          <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No reports found" variant={EmptyStateVariant.sm}>
          </EmptyState>
        </Bullseye>
      </Td>
    </Tr>;
  };

  const reportsTable = () => {
    return reports.map((r, rowIndex) => {
      const rowActions = [
        {
          title: 'Retry',
          onClick: () => onRetry(r.id),
          isOutsideDropdown: true
        },
        {
          title: 'Delete',
          onClick: () => {
            onSelectItem(r.id, rowIndex, true);
            setModalOpen(true);
          },
          isOutsideDropdown: true
        }
      ];
      return <Tr key={r.id}>
        <Td select={{
          rowIndex,
          onSelect: (_event, isSelecting) => onSelectItem(r.id, rowIndex, isSelecting),
          isSelected: isSelectedItem(rowIndex)
        }}> </Td>
        <Td dataLabel={columnNames[0].label} modifier="nowrap"><Link to={`/reports/${r.id}`} >{r.name}</Link></Td>
        <Td dataLabel={columnNames[1].label} modifier="nowrap">{r.vulns.map(vuln => {
          const uid = getUniqueId("div");
          return <div key={uid}><Link to={`/reports?vulnId=${vuln.vulnId}`}>
          {vuln.vulnId} 
        </Link><JustificationBanner justification={vuln.justification} /></div>
        })}</Td>
        <Td dataLabel={columnNames[2].label} modifier="nowrap">{r.completedAt ? r.completedAt : '-'}</Td>
        <Td dataLabel={columnNames[3].label} modifier="nowrap">{r.metadata?.submitted_at || '-'}</Td>
        <Td dataLabel={columnNames[4].label}><StatusLabel type={r.state} /></Td>
        <Td dataLabel="Actions">
          <Flex columnGap={{ default: 'columnGapSm' }}>
            <Tooltip content="Submit again the report to Morpheus">
              <Button onClick={() => onRetry(r.id)} variant="stateful" aria-label="retry" state="read" icon={<RedoIcon/>}/>
            </Tooltip>
            <Button onClick={() => {
              onSelectOnlyItem(r.id, rowIndex); 
              setModalOpen(true);
            }} variant="stateful" aria-label="delete" state="attention" icon={<TrashIcon/>}/>
          </Flex>
        </Td>
      </Tr>
    });
  }

  let filterLabels = [];
  searchParams.forEach((value, key) => {
    if(key !== 'status') {
      let color = getMetadataColor(key);
      filterLabels.push(<Label color={color} onClose={() => onRemoveFilter(key)} >{key}={value}</Label>);
    }
  });

  return <>
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem>
          Status: <Select toggle={toggleRef => <MenuToggle ref={toggleRef} 
              onClick={() => onStatusToggle()} 
              isExpanded={statusIsExpanded} >{statusFilter[statusSelected]}</MenuToggle>}
              onSelect={onStatusSelect} onOpenChange={isOpen => setStatusIsExpanded(isOpen)}
              selected={statusSelected} isOpen={statusIsExpanded}>
                {Object.keys(statusFilter).map((option, index) => <SelectOption key={index} value={option}>{statusFilter[option]}</SelectOption>)}
          </Select>
          {filterLabels}
        </ToolbarItem>
        <ToolbarItem>
          {showDeleteButton() ? <Button variant="danger" onClick={setModalOpen} aria-label="delete" icon={<TrashIcon />}>Delete</Button> : ""}
        </ToolbarItem>
        <ToolbarItem variant="pagination">
        <Button variant="plain" aria-label="Action" onClick={loadReports} icon={<SyncAltIcon />} />
          <Pagination itemCount={totalElements} perPage={perPage} page={page} onSetPage={onSetPage} widgetId="top-pagination" onPerPageSelect={onPerPageSelect} ouiaId="PaginationTop" />
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
          <Th width={20} sort={getSortParams(0)}>{columnNames[0].label}</Th>
          <Th width={10}>{columnNames[1].label}</Th>
          <Th width={10} sort={getSortParams(2)}>{columnNames[2].label}</Th>
          <Th width={10} sort={getSortParams(3)}>{columnNames[3].label}</Th>
          <Th>{columnNames[4].label}</Th>
          <Td>Actions</Td>
        </Tr>
      </Thead>
      <Tbody>
        {reports.length == 0 ? emptyTable() : reportsTable()}
      </Tbody>
    </Table>
    <Modal variant={ModalVariant.small} isOpen={isModalOpen}
      onClose={onCloseModal}
    >
      <ModalHeader title="Are you sure?" />
      <ModalBody>
        {deleteAll ? "All items will be permanently deleted" : `${deleteItems.length} reports will be permanently deleted.`}
      </ModalBody>
      <ModalFooter>
        <Button key="confirm" variant="danger" onClick={onConfirmDelete}>Delete</Button>
        <Button key="close" variant="link" onClick={onCloseModal}>Close</Button>
      </ModalFooter>
    </Modal>
  </>
};