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
  Title,
  EmptyState,
  EmptyStateBody,
} from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";
import type { CveMetadata } from "../hooks/useCveDetails";

interface CveVulnerablePackagesCardProps {
  metadata: CveMetadata | null;
}

/**
 * Component to display CVE vulnerable packages with their details
 */
const CveVulnerablePackagesCard: React.FC<CveVulnerablePackagesCardProps> = ({
  metadata,
}) => {
  const vulnerablePackages = metadata?.vulnerablePackages;

  if (!vulnerablePackages || vulnerablePackages.length === 0) {
    return (
      <EmptyState
        titleText="No vulnerable packages available"
        headingLevel="h4"
        icon={SearchIcon}
      >
        <EmptyStateBody>
          No vulnerable packages available for this CVE.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <List isPlain={true}>
      {vulnerablePackages.map((pkg, index) => (
        <ListItem key={index}>
          <Title headingLevel="h5" size="md" style={{ marginBottom: "0.5rem" }}>
            <strong>{pkg.name}</strong>
          </Title>
          <div>Ecosystem : {pkg.ecosystem || "Not Available"}</div>
          <div>
            Vulnerable Version : {pkg.vulnerableVersionRange || "Not Available"}
          </div>
          <div>
            First patched Version : {pkg.firstPatchedVersion || "Not Available"}
          </div>
        </ListItem>
      ))}
    </List>
  );
};

export default CveVulnerablePackagesCard;
