import { Bullseye, Button, EmptyState, EmptyStateHeader, EmptyStateIcon, EmptyStateVariant, Label, Pagination, getUniqueId } from "@patternfly/react-core";
import { deleteReport, listReports } from "../services/ReportClient";
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import JustificationBanner from "./JustificationBanner";
import { ConfirmationButton } from "./ConfirmationButton";

export default function ReportsTable() {

  const [searchParams, setSearchParams] = useSearchParams();
  const [vulnId, setVulnId] = React.useState(searchParams.get('vulnId') || '');

  const { addAlert } = useOutletContext();
  const [reports, setReports] = React.useState([]);
  const [activeSortDirection, setActiveSortDirection] = React.useState('desc');
  const [activeSortIndex, setActiveSortIndex] = React.useState(2); // Completed At
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);
  const [totalElements, setTotalElements] = React.useState(0);

  const onSetPage = (_event, newPage) => {
    setPage(newPage);
    loadReports();
  }
  const onPerPageSelect = (_event, newPerPage, newPage) => {
    setPerPage(newPerPage);
    setPage(newPage);
    loadReports();
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

  const onRemoveFilter = () => {
    const {vulnId, ...newSearchParams} = searchParams;
    setSearchParams(newSearchParams);
  };

  React.useEffect(() => {
    setVulnId(searchParams.get('vulnId') || '');
    loadReports();
  }, [searchParams, vulnId]);

  const onDelete = (id) => {
    deleteReport(id).then(() => loadReports());
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
      newParams.set("sortBy", `${field}:${direction}` );
      setSearchParams(newParams);
    },
    columnIndex
  });

  const columnNames = [
    { key: 'name', label: 'ID' },
    { key: 'vulns', label: 'CVEs' },
    { key: 'completedAt', label: 'Completed At' },
    { key: 'imageName', label: 'Image Name' },
    { key: 'imageTag', label: 'Image Tag' }
  ];

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
    return reports.map(r => {
      return <Tr key={r.id}>
        <Td dataLabel={columnNames[0].label} modifier="truncate">{r.name}</Td>
        <Td dataLabel={columnNames[1].label} modifier="nowrap">{r.vulns.map(vuln => {
          const uid = getUniqueId("div");
          return <div key={uid}>{vuln.vulnId} <JustificationBanner justification={vuln.justification} /></div>
        })}</Td>
        <Td dataLabel={columnNames[2].label} modifier="nowrap">{r.completedAt ? r.completedAt : '-'}</Td>
        <Td dataLabel={columnNames[3].label} modifier="truncate">{r.imageName}</Td>
        <Td dataLabel={columnNames[4].label} modifier="truncate">{r.imageTag}</Td>
        <Td dataLabel="View"><Button component={Link} variant="secondary" to={`/reports/${r.id}`}>View</Button></Td>
        <Td dataLabel="Delete">
        <ConfirmationButton btnVariant="danger" 
          onConfirm={() => onDelete(r.id)} 
          message={`The report with id: ${r.name} will be permanently deleted.`}>Delete</ConfirmationButton>
        </Td>
      </Tr>
    });
  }

  return <>
    {searchParams.get('vulnId') ? <Label color="blue" onClose={onRemoveFilter} >{searchParams.get('vulnId')}</Label> : ''}
    <Pagination itemCount={totalElements} perPage={perPage} page={page} onSetPage={onSetPage} widgetId="top-pagination" onPerPageSelect={onPerPageSelect} ouiaId="PaginationTop" />
    <Table>
      <Thead>
        <Tr>
          <Th width={20} sort={getSortParams(0)}>{columnNames[0].label}</Th>
          <Th width={10}>{columnNames[1].label}</Th>
          <Th width={10} sort={getSortParams(2)}>{columnNames[2].label}</Th>
          <Th>{columnNames[3].label}</Th>
          <Th>{columnNames[4].label}</Th>
          <Td colSpan={2}>Actions</Td>
        </Tr>
      </Thead>
      <Tbody>
        {reports.length == 0 ? emptyTable() : reportsTable()}
      </Tbody>
    </Table>
  </>
};