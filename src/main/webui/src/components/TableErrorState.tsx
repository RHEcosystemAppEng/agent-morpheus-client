import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { getErrorMessage } from "../utils/errorHandling";

interface TableErrorStateProps {
  columnNames: string[];
  error: Error;
  titleText?: string;
}

const TableErrorState: React.FC<TableErrorStateProps> = ({
  columnNames,
  titleText = "Error loading data",
  error,
}) => {
  return (
    <Table aria-label="Empty table">
      <Thead>
        <Tr>
          {columnNames.map((name, index) => (
            <Th key={index}>{name}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Td colSpan={columnNames.length}>
            <Bullseye>
              <EmptyState
                icon={ExclamationCircleIcon}
                titleText={titleText}
                headingLevel="h2"
                variant={EmptyStateVariant.sm}
              >
                <EmptyStateBody>{getErrorMessage(error)}</EmptyStateBody>
              </EmptyState>
            </Bullseye>
          </Td>
        </Tr>
      </Tbody>
    </Table>
  );
};

export default TableErrorState;