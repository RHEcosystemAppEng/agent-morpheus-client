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

import {
  List,
  ListItem,
  EmptyState,
  EmptyStateBody,
} from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";
import type { CveMetadata } from "../hooks/useCveDetails";

interface CveReferencesCardProps {
  metadata: CveMetadata | null;
}

/**
 * Component to display CVE references as a list of clickable links
 */
const CveReferencesCard: React.FC<CveReferencesCardProps> = ({ metadata }) => {
  const references = metadata?.references;

  if (!references || references.length === 0) {
    return (
      <EmptyState
        titleText="No references available"
        headingLevel="h4"
        icon={SearchIcon}
      >
        <EmptyStateBody>No references available for this CVE.</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <List>
      {references.map((reference, index) => (
        <ListItem key={index}>
          <a href={reference} target="_blank" rel="noreferrer">
            {reference}
          </a>
        </ListItem>
      ))}
    </List>
  );
};

export default CveReferencesCard;
