import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import {
  Bullseye,
  EmptyState,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";

interface TableEmptyStateProps {
  columnCount: number;
  titleText?: string;
}

const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  columnCount,
  titleText = "No results found",
}) => {
  return (
    <Table aria-label="Empty table">
      <Thead>
        <Tr>
          {Array.from({ length: columnCount }).map((_, index) => (
            <Th key={index} aria-label="Empty column header" />
          ))}
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td colSpan={columnCount}>
            <Bullseye>  
              <EmptyState
                headingLevel="h2"
                titleText={titleText}
                icon={SearchIcon}
                variant={EmptyStateVariant.sm}
              />
            </Bullseye>
          </Td>
        </Tr>
      </Tbody>
    </Table>
  );
};

export default TableEmptyState;
