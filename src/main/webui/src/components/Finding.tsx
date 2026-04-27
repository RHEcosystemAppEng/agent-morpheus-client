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

import { Label, LabelProps } from "@patternfly/react-core";
import type { Finding as FindingType } from "../utils/findingDisplay";
import { ExclamationCircleIcon, InProgressIcon } from "@patternfly/react-icons";
import { apiToColor, JUSTIFICATION_API } from "../utils/justificationStatus";

export interface FindingProps {
  finding: FindingType | null;
}

const InProgressStatus: React.FC = () => (
  <Label color="grey" variant="outline" icon={<InProgressIcon />}>
    In progress
  </Label>
);

export const FailedStatus: React.FC = () => (
  <Label color="grey" variant="filled" icon={<ExclamationCircleIcon />}>
    Failed
  </Label>
);

const Finding: React.FC<FindingProps> = ({ finding }) => {
  if (!finding) return null;
  
  let label: string;
  let color: LabelProps["color"];

  switch (finding.type) {
    case "failed":
      return <FailedStatus />;
    case "in-progress":
      return <InProgressStatus />;
    case "vulnerable":
      label = "Vulnerable";
      color = apiToColor(JUSTIFICATION_API.VULNERABLE);
      break;
    case "not-vulnerable":
      label = "Not vulnerable";
      color = apiToColor(JUSTIFICATION_API.NOT_VULNERABLE);
      break;
    case "excluded":
      label = "Excluded";
      color = "grey";
      break;
    case "uncertain":
      label = "Uncertain";
      color = apiToColor(JUSTIFICATION_API.UNCERTAIN);
      break;
    default: {
      return null;
    }
  }

  const labelText =
    finding.count !== undefined ? `${finding.count} ${label}` : label;

  return (
    <Label color={color} variant="filled">
      {labelText}
    </Label>
  );
};

export default Finding;
