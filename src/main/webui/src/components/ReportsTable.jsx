import { Bullseye, Button, EmptyState, EmptyStateHeader, EmptyStateIcon, EmptyStateVariant, Modal, ModalVariant, Truncate } from "@patternfly/react-core";
import { deleteReport, listReports } from "../services/ReportClient";
import { ToastNotifications } from "./Notifications";
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { redirect, useNavigate } from "react-router-dom";

export default function ReportsTable() {

  const [reports, setReports] = React.useState([]);
  const [alerts, setAlerts] = React.useState([]);
  const [confirmation, setConfirmation] = React.useState({ isOpen: false });
  const [activeSortDirection, setActiveSortDirection] = React.useState('desc');
  const [activeSortIndex, setActiveSortIndex] = React.useState(3); // Completed At
  const navigate = useNavigate();

  const loadReports = () => {
    listReports().then(d => {
      setReports(d)
    })
      .catch(e => {
        addAlert('danger', 'Unable to load reports table')
      })
  }
  React.useEffect(() => {
    loadReports();
  }, []);

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

  const onView = id => {
    navigate(`/reports/${id}`);
  }

  const onDelete = () => {
    deleteReport(confirmation.id).then(() => loadReports());
    onCloseConfirmation();
  }

  const onConfirmDelete = id => {
    setConfirmation({ isOpen: true, id: id });
  }

  const onCloseConfirmation = () => {
    setConfirmation({ isOpen: false });
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
    },
    columnIndex
  });

  const getSortableRowValues = report => {
    const {id, vulns, startedAt, completedAt} = report;
    return [id, vulns, startedAt, completedAt];
  };

  let sortedReports = reports;
  if (activeSortIndex !== null) {
    sortedReports = reports.sort((a, b) => {
      let aValue = getSortableRowValues(a)[activeSortIndex];
      let bValue = getSortableRowValues(b)[activeSortIndex];
      if (typeof aValue === 'number') {
        if (activeSortDirection === 'asc') {
          return aValue - bValue;
        }
        return bValue - aValue;
      } 
      if (Array.isArray(aValue)) {
        aValue = aValue.toString();
        bValue = bValue.toString();
      } 
      if (activeSortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      }
      return bValue.localeCompare(aValue);
    });
  }

  const columnNames = {
    id: "ID",
    imageName: "Image Name",
    imageTag: "Image Tag",
    vulns: "CVEs",
    startedAt: "Started At",
    completedAt: "Completed At"
  }

  const emptyTable = () => {
    return <Tr>
      <Td colSpan={6}>
        <Bullseye>
          <EmptyState variant={EmptyStateVariant.sm}>
            <EmptyStateHeader icon={<EmptyStateIcon icon={SearchIcon} />} titleText="No reports found" headingLevel="h2" />
          </EmptyState>
        </Bullseye>
      </Td>
    </Tr>;
  }

  const reportsTable = () => {
    return sortedReports.map(r => {
      return <Tr key={r.id}>
        <Td dataLabel={columnNames.id} modifier="truncate">{r.id}</Td>
        <Td dataLabel={columnNames.vulns} modifier="nowrap">{r.vulns}</Td>
        <Td dataLabel={columnNames.startedAt} modifier="nowrap">{r.startedAt !== 'null' ? r.startedAt : '-'}</Td>
        <Td dataLabel={columnNames.completedAt} modifier="nowrap">{r.completedAt !== 'null' ? r.completedAt : '-'}</Td>
        <Td dataLabel={columnNames.imageName} modifier="truncate">{r.imageName}</Td>
        <Td dataLabel={columnNames.imageTag} modifier="truncate">{r.imageTag}</Td>
        <Td dataLabel="View"><Button variant="secondary" onClick={() => onView(r.id)}>View</Button></Td>
        <Td dataLabel="Delete"><Button variant="danger" onClick={() => onConfirmDelete(r.id)}>Delete</Button>
        </Td>
      </Tr>
    });
  }

  return <>
    <Table>
      <Thead>
        <Tr>
          <Th width={20} sort={getSortParams(0)}>{columnNames.id}</Th>
          <Th width={10} sort={getSortParams(1)}>{columnNames.vulns}</Th>
          <Th width={10} sort={getSortParams(2)}>{columnNames.startedAt}</Th>
          <Th width={10} sort={getSortParams(3)}>{columnNames.completedAt}</Th>
          <Th>{columnNames.imageName}</Th>
          <Th>{columnNames.imageTag}</Th>
          <Td colSpan={2}>Actions</Td>
        </Tr>
      </Thead>
      <Tbody>
        {reports.length == 0 ? emptyTable() : reportsTable()}
      </Tbody>
    </Table>
    <ToastNotifications alerts={alerts} onDeleteAlert={onDeleteAlert} />
    <Modal variant={ModalVariant.small} title="Permanently delete report?" isOpen={confirmation.isOpen}
      onClose={onCloseConfirmation}
      actions={[<Button key="confirm" variant="danger" onClick={onDelete}>Delete</Button>,
      <Button key="close" variant="link" onClick={onCloseConfirmation}>Close</Button>]}
    >
      The report with id: {confirmation.id} will be permanently deleted.
    </Modal>
  </>
};