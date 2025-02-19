import { Bullseye, Button, EmptyState, EmptyStateVariant, Label, MenuToggle, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, Pagination, Select, SelectOption, Toolbar, ToolbarContent, ToolbarItem, getUniqueId } from "@patternfly/react-core";
import { deleteReport, listReports, retryReport } from "../services/ReportClient";
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { useOutletContext, useSearchParams, useNavigate } from "react-router-dom";
import JustificationBanner from "./JustificationBanner";
import { StatusLabel } from "./StatusLabel";

export default function ReportsTable() {

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { addAlert } = useOutletContext();
  const [reports, setReports] = React.useState([]);
  const [activeSortDirection, setActiveSortDirection] = React.useState('desc');
  const [activeSortIndex, setActiveSortIndex] = React.useState(2); // Completed At
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);
  const [totalElements, setTotalElements] = React.useState(0);
  const [modalItem, setModalItem] = React.useState(null);
  const [isModalOpen, setModalOpen] = React.useState(false);
  const [statusIsExpanded, setStatusIsExpanded] = React.useState(false);
  const [statusSelected, setStatusSelected] = React.useState('');

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
    deleteReport(modalItem?.id).then(() => loadReports());
  }

  const onCloseModal = () => {
    setModalItem(null);
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

  const statusFilter = {
    any: "Any",
    completed: "Completed",
    failed: "Failed",
    queued: "Queued",
    sent: "Sent"
  };

  const colorFilters = {
    "batch_id": "blue",
    "user": "orange",
    "vulnId": "red"
  };

  const columnNames = [
    { key: 'name', label: 'ID' },
    { key: 'vulns', label: 'CVEs' },
    { key: 'completedAt', label: 'Completed At' },
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
    return reports.map(r => {
      const rowActions = [
        {
          title: 'View',
          isOutsideDropdown: true,
          onClick: () => navigate(`/reports/${r.id}`)
        },
        {
          title: 'Retry',
          onClick: () => onRetry(r.id)
        },
        {
          title: 'Delete',
          onClick: () => {
            setModalItem(r);
            setModalOpen(true);
          }
        }
      ];
      return <Tr key={r.id}>
        <Td dataLabel={columnNames[0].label} modifier="nowrap">{r.name}</Td>
        <Td dataLabel={columnNames[1].label} modifier="nowrap">{r.vulns.map(vuln => {
          const uid = getUniqueId("div");
          return <div key={uid}>{vuln.vulnId} <JustificationBanner justification={vuln.justification} /></div>
        })}</Td>
        <Td dataLabel={columnNames[2].label} modifier="nowrap">{r.completedAt ? r.completedAt : '-'}</Td>
        <Td dataLabel={columnNames[3].label}><StatusLabel type={r.state} /></Td>
        <Td dataLabel="Actions">
          <ActionsColumn items={rowActions} />
        </Td>
      </Tr>
    });
  }

  let filterLabels = [];
  searchParams.forEach((value, key) => {
    if(key !== 'status') {
      let color = "grey";
      if(colorFilters[key] !== undefined) {
        color = colorFilters[key];
      }
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
        <ToolbarItem variant="pagination">
          <Pagination itemCount={totalElements} perPage={perPage} page={page} onSetPage={onSetPage} widgetId="top-pagination" onPerPageSelect={onPerPageSelect} ouiaId="PaginationTop" />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
    <Table>
      <Thead>
        <Tr>
          <Th width={20} sort={getSortParams(0)}>{columnNames[0].label}</Th>
          <Th width={10}>{columnNames[1].label}</Th>
          <Th width={10} sort={getSortParams(2)}>{columnNames[2].label}</Th>
          <Th>{columnNames[3].label}</Th>
          {/* <Th>{columnNames[4].label}</Th>
          <Th>{columnNames[5].label}</Th> */}
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
        The report with id: {modalItem?.name} will be permanently deleted.
      </ModalBody>
      <ModalFooter>
        <Button key="confirm" variant="danger" onClick={onConfirmDelete}>Delete</Button>
        <Button key="close" variant="link" onClick={onCloseModal}>Close</Button>
      </ModalFooter>
    </Modal>
  </>
};