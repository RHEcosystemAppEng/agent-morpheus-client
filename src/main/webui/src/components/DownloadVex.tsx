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

interface DownloadDropdownProps {
  report: FullReport;
}

// Scan ID for filename; falls back to "report" when missing (per FullReport type: input.scan.id is string | undefined).
function scanIdString(report: FullReport): string {
  return report.input?.scan?.id ?? "report";
}

const DownloadDropdown: React.FC<DownloadDropdownProps> = ({ report }) => {
  const [isOpen, setIsOpen] = useState(false);

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
      <DropdownItem key="vex" onClick={handleDownloadVex} isDisabled={!hasVex}>
        VEX
      </DropdownItem>
      <DropdownItem key="report" onClick={handleDownloadReport}>
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
          splitButtonItems={[
            <MenuToggleAction
              key="download-split-action"
              id="download-report-split-action"
              aria-label="Download"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
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
