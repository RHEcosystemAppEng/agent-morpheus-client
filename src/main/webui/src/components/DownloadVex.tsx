import { useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from "@patternfly/react-core";
import { DownloadIcon } from "@patternfly/react-icons";
import type { FullReport } from "../types/FullReport";

interface DownloadDropdownProps {
  report: FullReport;
  cveId: string;
}

const DownloadDropdown: React.FC<DownloadDropdownProps> = ({
  report,
  cveId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
    setIsOpen(false);
    setIsDownloading(true);

    const vexData = report.output?.vex;
    if (!vexData || vexData === null) {
      setIsDownloading(false);
      return;
    }

    const filename = `vex-${cveId}-${report._id || "report"}.json`;
    downloadFile(vexData, filename);
    setIsDownloading(false);
  };

  const handleDownloadReport = () => {
    setIsOpen(false);
    setIsDownloading(true);

    const filename = `report-${cveId}-${report._id || "report"}.json`;
    downloadFile(report, filename);
    setIsDownloading(false);
  };

  const hasVex = report.output?.vex !== null;

  const dropdownItems = (
    <>
      <DropdownItem
        key="vex"
        onClick={handleDownloadVex}
        isDisabled={!hasVex || isDownloading}
      >
        VEX
      </DropdownItem>
      <DropdownItem
        key="report"
        onClick={handleDownloadReport}
        isDisabled={isDownloading}
      >
        Report
      </DropdownItem>
    </>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          isExpanded={isOpen}
          onClick={onToggle}
          icon={<DownloadIcon />}
          isDisabled={isDownloading}
          variant="primary"
          style={{
            borderRadius: "2rem",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
          }}
        >
          Download
        </MenuToggle>
      )}
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  );
};

export default DownloadDropdown;
