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

import { Label } from "@patternfly/react-core";
import { CheckCircleIcon, SyncIcon } from "@patternfly/react-icons";
import { FailedStatus } from "./Finding";
import { isFailingState } from "../utils/findingDisplay";

interface ReportStatusLabelProps {
  state?: string | null;
}

const ReportStatusLabel: React.FC<ReportStatusLabelProps> = ({ state }) => {
  if (!state) return null;

  const formatToTitleCase = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const stateLower = state.toLowerCase();

  if (stateLower === "completed") {
    return (
      <Label status="success" variant="outline" icon={<CheckCircleIcon />}>
        {formatToTitleCase(state)}
      </Label>
    );
  }

  if (isFailingState(state)) {
    return <FailedStatus />;
  }

  if (stateLower === "queued" || stateLower === "sent" || stateLower === "pending") {
    return (
      <Label variant="outline" icon={<SyncIcon />}>
        {formatToTitleCase(state)}
      </Label>
    );
  }

  return (
    <Label status="info" variant="outline">
      {formatToTitleCase(state)}
    </Label>
  );
};

export default ReportStatusLabel;

