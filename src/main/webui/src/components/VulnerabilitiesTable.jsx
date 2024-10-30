import { Bullseye, Button, EmptyState, EmptyStateHeader, EmptyStateIcon, EmptyStateVariant } from "@patternfly/react-core";
import { deleteVulnerability, listVulnerabilities } from "../services/VulnerabilityClient";
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { useOutletContext, Link, useSearchParams } from "react-router-dom";
import { ConfirmationButton } from "./ConfirmationButton";

export default function VulnerabilitiesTable() {

  const [searchParams, setSearchParams] = useSearchParams();
  const { addAlert } = useOutletContext();
  const [vulnerabilities, setVulnerabilities] = React.useState([]);
  const [activeSortDirection, setActiveSortDirection] = React.useState('asc');
  const [activeSortIndex, setActiveSortIndex] = React.useState(0); // ID

  const loadVulnerabilities = () => {
    listVulnerabilities(searchParams).then(d => {
      setVulnerabilities(d)
    })
      .catch(e => {
        addAlert('danger', 'Unable to load vulnerabilities table')
      })
  }

  React.useEffect(() => {
    loadVulnerabilities();
  }, [searchParams]);

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

  const columnNames = [
    { key: "id", label: "Vulnerability" },
    { key: "comments", label: "Comments" }
  ];

  const emptyTable = () => {
    return <Tr>
      <Td colSpan={6}>
        <Bullseye>
          <EmptyState variant={EmptyStateVariant.sm}>
            <EmptyStateHeader icon={<EmptyStateIcon icon={SearchIcon} />} titleText="No vulnerabilities found" headingLevel="h2" />
          </EmptyState>
        </Bullseye>
      </Td>
    </Tr>;
  }

  const VulnerabilityRow = ({ data }) => {
    const onDelete = () => {
      deleteVulnerability(data.id).then(() => loadVulnerabilities());
    }

    return <Tr>
      <Td dataLabel={columnNames[0].label} modifier="nowrap">{data.id}</Td>
      <Td dataLabel={columnNames[1].label} modifier="breakWord">{data.comments}</Td>
      <Td dataLabel="Edit"><Button component={Link} variant="secondary" to={`/vulnerabilities/${data.id}`}>Edit</Button></Td>
      <Td dataLabel="Reports"><Button component={Link} variant="tertiary" to={`/reports?vulnId=${data.id}`}>Reports</Button></Td>
      <Td dataLabel="Delete">
        <ConfirmationButton btnVariant="danger"
          onConfirm={() => onDelete(data.id)}
          message={`The vulnerability with id: ${data.id} will be permanently deleted.`}>Delete</ConfirmationButton>
      </Td>

    </Tr>
  }

  const vulnerabilitiesTable = () => {
    return vulnerabilities.map((v, index) => {
      return <VulnerabilityRow key={index} data={v} />
    });
  }

  return <>
    <Button type="primary" component={Link} to='/vulnerabilities/new'>Add new</Button>
    <Table>
      <Thead>
        <Tr>
          <Th width={20} sort={getSortParams(0)}>{columnNames[0].label}</Th>
          <Th width={70}>{columnNames[1].label}</Th>
          <Td colSpan={2}>Actions</Td>
        </Tr>
      </Thead>
      <Tbody>
        {vulnerabilities.length == 0 ? emptyTable() : vulnerabilitiesTable()}
      </Tbody>
    </Table>
  </>
};