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

import ReactMarkdown from "react-markdown";
import { Content, EmptyState, EmptyStateBody } from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";
import type { CveMetadata } from "../hooks/useCveDetails";

interface CveDescriptionCardProps {
  metadata: CveMetadata | null;
}

/**
 * CVE description rendered as markdown inside PatternFly `Content`, matching
 * report Details (summary/reason) and analysis Q&A responses in `ChecklistCard`.
 */
const CveDescriptionCard: React.FC<CveDescriptionCardProps> = ({
  metadata,
}) => {
  const description = metadata?.description;

  if (!description) {
    return (
      <EmptyState
        titleText="No description available"
        headingLevel="h4"
        icon={SearchIcon}
      >
        <EmptyStateBody>No description available for this CVE.</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Content>
      <ReactMarkdown>{description}</ReactMarkdown>
    </Content>
  );
};

export default CveDescriptionCard;
