// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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