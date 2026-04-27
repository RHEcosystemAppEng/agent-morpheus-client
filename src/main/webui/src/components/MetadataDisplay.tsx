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

import { Label, LabelGroup } from "@patternfly/react-core";
import NotAvailable from "./NotAvailable";

interface MetadataDisplayProps {
  metadata: Record<string, string | { $date: string }> | undefined;
}

const formatMetadataValue = (value: string | { $date: string }): string => {
  // Handle MongoDB date format if present
  if (value && typeof value === "object" && "$date" in value) {
    return (value as { $date: string }).$date;
  }
  return String(value);
};

const MetadataDisplay: React.FC<MetadataDisplayProps> = ({ metadata }) => {
  if (!metadata) {
    return <NotAvailable />;
  }

  const entries = Object.entries(metadata);

  if (entries.length === 0) {
    return <NotAvailable />;
  }

  return (
    <LabelGroup>
      {entries.map(([key, value], idx) => (
        <Label key={`${key}_${idx}`} style={{maxWidth: "300px"}}>
          <span style={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
            {key}:{formatMetadataValue(value)}
          </span>          
        </Label>
      ))}
    </LabelGroup>
  );
};

export default MetadataDisplay;

