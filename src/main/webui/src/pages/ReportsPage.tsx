import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Content, PageSection } from "@patternfly/react-core";
import ReportsTable from "../components/ReportsTable";
import type { ReportsToolbarFilters } from "../components/ReportsToolbar";
import type { SortColumn, SortDirection } from "../hooks/useReportsTableData";

const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState<string>("");
  const [cveSearchValue, setCveSearchValue] = useState<string>("");
  const [filters, setFilters] = useState<ReportsToolbarFilters>({});
  const [activeAttribute, setActiveAttribute] = useState<
    "SBOM Name" | "CVE ID"
  >("SBOM Name");
  const [sortColumn, setSortColumn] = useState<SortColumn>("submittedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Restore filter state from URL on mount
  useEffect(() => {
    const sbomName = searchParams.get("sbomName") || "";
    const cveId = searchParams.get("cveId") || "";
    const sortField = searchParams.get("sortField");
    const sortDir = searchParams.get("sortDirection");

    setSearchValue(sbomName);
    setCveSearchValue(cveId);

    setFilters({});

    // Restore sort state from URL
    if (
      sortField &&
      (sortField === "name" ||
        sortField === "submittedAt" ||
        sortField === "completedAt" ||
        sortField === "cveId")
    ) {
      setSortColumn(sortField as SortColumn);
    }
    if (sortDir && (sortDir === "asc" || sortDir === "desc")) {
      setSortDirection(sortDir);
    }
  }, []);

  // Update URL when filters or sort change
  const updateUrlParams = (
    sbomName: string,
    cveId: string,
    sortCol?: SortColumn,
    sortDir?: SortDirection
  ) => {
    const newParams = new URLSearchParams();
    if (sbomName) newParams.set("sbomName", sbomName);
    if (cveId) newParams.set("cveId", cveId);
    // Add sort parameters (use current state if not provided)
    const currentSortCol = sortCol !== undefined ? sortCol : sortColumn;
    const currentSortDir = sortDir !== undefined ? sortDir : sortDirection;
    // Only add sort params if not default (submittedAt DESC)
    if (currentSortCol !== "submittedAt" || currentSortDir !== "desc") {
      newParams.set("sortField", currentSortCol);
      newParams.set("sortDirection", currentSortDir);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    updateUrlParams(value, cveSearchValue);
  };

  const handleCveSearchChange = (value: string) => {
    setCveSearchValue(value);
    updateUrlParams(searchValue, value);
  };

  const handleFiltersChange = (newFilters: ReportsToolbarFilters) => {
    setFilters(newFilters);
    updateUrlParams(searchValue, cveSearchValue);
  };

  const handleSortChange = (column: SortColumn, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
    updateUrlParams(searchValue, cveSearchValue, column, direction);
  };

  const handleClearFilters = () => {
    setSearchValue("");
    setCveSearchValue("");
    setFilters({});
    // Reset sort to default
    setSortColumn("submittedAt");
    setSortDirection("desc");
    setSearchParams({}, { replace: true });
  };

  return (
    <>
      <PageSection isWidthLimited aria-labelledby="main-title">
        <Content>
          <h1><strong>Reports</strong></h1>
          <p>View comprehensive report for your product and their security analysis. Reports include CVE exploitability assessments, VEX status justifications, and detailed analysis summaries.</p>
        </Content>        
      </PageSection>
      <PageSection>
        <ReportsTable
          searchValue={searchValue}
          cveSearchValue={cveSearchValue}
          filters={filters}
          activeAttribute={activeAttribute}
          onSearchChange={handleSearchChange}
          onCveSearchChange={handleCveSearchChange}
          onFiltersChange={handleFiltersChange}
          onActiveAttributeChange={setActiveAttribute}
          onClearFilters={handleClearFilters}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      </PageSection>
    </>
  );
};

export default ReportsPage;
