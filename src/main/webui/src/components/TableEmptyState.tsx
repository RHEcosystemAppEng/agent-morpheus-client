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
