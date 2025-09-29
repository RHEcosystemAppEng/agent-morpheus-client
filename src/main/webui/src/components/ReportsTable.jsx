import { Bullseye, Button, EmptyState, EmptyStateVariant, Flex, Label, MenuToggle, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, Pagination, Select, SelectOption, Toolbar, ToolbarContent, ToolbarItem, getUniqueId } from "@patternfly/react-core";
import { deleteReports, listReports, retryReport } from "../services/ReportClient";
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { TrashIcon } from '@patternfly/react-icons/dist/esm/icons/trash-icon';
import { SyncAltIcon } from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import { useOutletContext, useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import JustificationBanner from "./JustificationBanner";
import { StatusLabel } from "./StatusLabel";
import { getMetadataColor } from "../Constants";
import { formatLocalDateTime } from "../services/DateUtils";
import CveStatus from "./CveStatus";
/** @typedef {import('../types').Report} Report */
/** @typedef {import('../types').Vuln} Vuln */

export default function ReportsTable({ initSearchParams }) {

  const [searchParams, setSearchParams] = useSearchParams(initSearchParams);
  const navigate = useNavigate();

  const { addAlert } = useOutletContext();
  const [reports, setReports] = React.useState([]);
  const [activeSortDirection, setActiveSortDirection] = React.useState('desc');
  const [activeSortIndex, setActiveSortIndex] = React.useState(4); // Submitted At
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);
  const [totalElements, setTotalElements] = React.useState(0);
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [statusIsExpanded, setStatusIsExpanded] = React.useState(false);
  const [statusSelected, setStatusSelected] = React.useState('');
  const [deleteItems, setDeleteItems] = React.useState([]);
  const [deleteAll, setDeleteAll] = React.useState(false);
  // Conditionally hide CVEs column if product_id is present in search params
  const hasProductId = !!searchParams.get('product_id');
  // Equal column widths setup (selection + data columns + actions)
  const dataColumnCount = hasProductId ? 6 : 7; // includes new CVE Status column
  const selectColWidthPx = 56;
  const equalColWidth = `calc((100% - ${selectColWidthPx}px) / ${dataColumnCount + 1})`;

  
  
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
    { key: 'imageName', label: 'Image' },
    { key: 'imageTag', label: 'Tag' },
    { key: 'cveStatus', label: 'ExploitIQ Status' },
    { key: 'vulns', label: 'CVEs' },
    { key: 'submittedAt', label: 'Submitted' },
    { key: 'completedAt', label: 'Completed' },
    { key: 'Scan state', label: 'State' }
  ];

  const emptyTable = () => {
    return <Tr>
      <Td colSpan={columnNames.length + 2 - (hasProductId ? 1 : 0)}>
        <Bullseye>
          <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No reports found" variant={EmptyStateVariant.sm}>
          </EmptyState>
        </Bullseye>
      </Td>
    </Tr>;
  };

  const reportsTable = () => {
    return reports.map((r, rowIndex) => {
      const firstVuln = r?.vulns && r.vulns.length > 0 ? r.vulns[0] : undefined;
      return <Tr key={r.id} >
        <Td select={{
          rowIndex,
          onSelect: (_event, isSelecting) => onSelectItem(r.id, rowIndex, isSelecting),
          isSelected: isSelectedItem(rowIndex)
        }}> </Td>
        <Td dataLabel={columnNames[0].label} modifier="nowrap">
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.imageName}>
            <Link to={`/reports?imageName=${r.imageName}`} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.imageName}</Link>
          </div>
        </Td>
        <Td dataLabel={columnNames[1].label} modifier="nowrap">
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.imageTag}>
            <Link to={`/reports?imageTag=${r.imageTag}`} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.imageTag}</Link>
          </div>
        </Td>
        <Td dataLabel={columnNames[2].label} modifier="nowrap"><CveStatus vuln={firstVuln} /></Td>
        {!hasProductId && (
          <Td dataLabel={columnNames[3].label} modifier="nowrap">{r.vulns.map(vuln => {
            const uid = getUniqueId("div");
            return <div key={uid}><Link to={`/reports?vulnId=${vuln.vulnId}`}>
            {vuln.vulnId} 
          </Link></div>
          })}</Td>
        )}
        <Td dataLabel={columnNames[4].label} modifier="nowrap">{formatLocalDateTime(r.metadata?.submitted_at)}</Td>
        <Td dataLabel={columnNames[5].label} modifier="nowrap">{formatLocalDateTime(r.completedAt)}</Td>
        <Td dataLabel={columnNames[6].label}><StatusLabel type={r.state} /></Td>
        <Td dataLabel="CVE Repository Report">
          <Flex columnGap={{ default: 'columnGapSm' }}>
            <Button onClick={() => navigate(`/reports/${r.id}`)} variant="primary" aria-label="view" >View</Button>
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
          {useParams().id ? null : filterLabels}
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
    <Table style={{ tableLayout: 'fixed', width: '100%' }}>
      <Thead>
        <Tr>
          <Th style={{ width: selectColWidthPx }} select={{
            onSelect: (_event, isSelecting) => onDeleteAll(isSelecting),
            isSelected: deleteAll
          }} aria-label="All Selected"/>
          <Th style={{ width: equalColWidth }} sort={getSortParams(0)}>{columnNames[0].label}</Th>
          <Th style={{ width: equalColWidth }} sort={getSortParams(1)}>{columnNames[1].label}</Th>
          <Th style={{ width: equalColWidth }}>{columnNames[2].label}</Th>
          {!hasProductId && (<Th style={{ width: equalColWidth }}>{columnNames[3].label}</Th>)}
          <Th style={{ width: equalColWidth }} sort={getSortParams(4)}>{columnNames[4].label}</Th>
          <Th style={{ width: equalColWidth }} sort={getSortParams(5)}>{columnNames[5].label}</Th>
          <Th style={{ width: equalColWidth }}>{columnNames[6].label}</Th>
          <Td style={{ width: equalColWidth }}>CVE Repository Report</Td>
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