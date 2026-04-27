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

import { useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleAction,
  MenuToggleElement,
} from "@patternfly/react-core";
import type { FullReport } from "../types/FullReport";
import { isInProgressState } from "../utils/findingDisplay";

interface DownloadDropdownProps {
  report: FullReport;
  /** Analysis status from the API (e.g. pending, queued, sent, completed). */
  analysisStatus?: string | null;
}

// Scan ID for filename; falls back to "report" when missing (per FullReport type: input.scan.id is string | undefined).
function scanIdString(report: FullReport): string {
  return report.input?.scan?.id ?? "report";
}

const DownloadDropdown: React.FC<DownloadDropdownProps> = ({
  report,
  analysisStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const downloadsDisabled = isInProgressState(analysisStatus ?? "");

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const downloadFile = (content: unknown, filename: string) => {
    const jsonString = JSON.stringify(content, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadVex = () => {
    const vexData = report.output?.vex;
    if (!vexData || vexData === null) {
      return;
    }

    const filename = `vex-${scanIdString(report)}.json`;
    downloadFile(vexData, filename);
  };

  const handleDownloadReport = () => {
    const filename = `${scanIdString(report)}.json`;
    downloadFile(report, filename);
  };

  const hasVex = report.output?.vex !== null;

  const dropdownItems = (
    <>
      <DropdownItem
        key="vex"
        onClick={handleDownloadVex}
        isDisabled={downloadsDisabled || !hasVex}
      >
        VEX
      </DropdownItem>
      <DropdownItem
        key="report"
        onClick={handleDownloadReport}
        isDisabled={downloadsDisabled}
      >
        Report
      </DropdownItem>
    </>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(open: boolean) => setIsOpen(open)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          isExpanded={isOpen}
          onClick={onToggle}
          variant="primary"
          isDisabled={downloadsDisabled}
          splitButtonItems={[
            <MenuToggleAction
              key="download-split-action"
              id="download-report-split-action"
              aria-label="Download"
              isDisabled={downloadsDisabled}
              onClick={(e) => {
                e.stopPropagation();
                if (!downloadsDisabled) {
                  onToggle();
                }
              }}
            >
              Download
            </MenuToggleAction>,
          ]}
          aria-label="Open download menu"
        />
      )}
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  );
};

export default DownloadDropdown;
