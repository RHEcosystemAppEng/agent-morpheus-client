import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { PageSection, Title } from "@patternfly/react-core";
import ReportsTable from "../components/ReportsTable";
import type { ReportsToolbarFilters } from "../components/ReportsToolbar";
import type { SortColumn, SortDirection } from "../hooks/useReportsTableData";

const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState<string>("");
  const [cveSearchValue, setCveSearchValue] = useState<string>("");
  const [filters, setFilters] = useState<ReportsToolbarFilters>({
    exploitIqStatus: [],
  });
  const [activeAttribute, setActiveAttribute] = useState<
    "SBOM Name" | "CVE ID" | "ExploitIQ Status"
  >("SBOM Name");
  const [sortColumn, setSortColumn] = useState<SortColumn>("completedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Restore filter state from URL on mount
  useEffect(() => {
    const sbomName = searchParams.get("sbomName") || "";
    const cveId = searchParams.get("cveId") || "";
    // TODO: exploitIqStatus filter not yet implemented - parameter is ignored
    // const exploitIqStatus = searchParams.get("exploitIqStatus") || "";
    const sortField = searchParams.get("sortField");
    const sortDir = searchParams.get("sortDirection");

    setSearchValue(sbomName);
    setCveSearchValue(cveId);

    // TODO: ExploitIQ Status filter - NOT YET IMPLEMENTED
    setFilters({
      exploitIqStatus: [],
    });

    // Restore sort state from URL
    if (
      sortField &&
      (sortField === "productId" ||
        sortField === "sbomName" ||
        sortField === "completedAt")
    ) {
      setSortColumn(sortField);
    }
    if (sortDir && (sortDir === "asc" || sortDir === "desc")) {
      setSortDirection(sortDir);
    }
  }, []);

  // Update URL when filters or sort change
  const updateUrlParams = (
    sbomName: string,
    cveId: string,
    exploitIqStatus: string[], // TODO: Not yet implemented - parameter is ignored
    sortCol?: SortColumn,
    sortDir?: SortDirection
  ) => {
    const newParams = new URLSearchParams();
    if (sbomName) newParams.set("sbomName", sbomName);
    if (cveId) newParams.set("cveId", cveId);
    // TODO: ExploitIQ Status filter
    // Add sort parameters (use current state if not provided)
    const currentSortCol = sortCol !== undefined ? sortCol : sortColumn;
    const currentSortDir = sortDir !== undefined ? sortDir : sortDirection;
    // Only add sort params if not default (completedAt DESC)
    if (currentSortCol !== "completedAt" || currentSortDir !== "desc") {
      newParams.set("sortField", currentSortCol);
      newParams.set("sortDirection", currentSortDir);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    updateUrlParams(value, cveSearchValue, filters.exploitIqStatus);
  };

  const handleCveSearchChange = (value: string) => {
    setCveSearchValue(value);
    updateUrlParams(searchValue, value, filters.exploitIqStatus);
  };

  const handleFiltersChange = (newFilters: ReportsToolbarFilters) => {
    setFilters(newFilters);
    updateUrlParams(searchValue, cveSearchValue, newFilters.exploitIqStatus);
  };

  const handleSortChange = (column: SortColumn, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
    updateUrlParams(
      searchValue,
      cveSearchValue,
      filters.exploitIqStatus,
      column,
      direction
    );
  };

  const handleClearFilters = () => {
    setSearchValue("");
    setCveSearchValue("");
    setFilters({ exploitIqStatus: [] });
    // Reset sort to default
    setSortColumn("completedAt");
    setSortDirection("desc");
    setSearchParams({}, { replace: true });
  };

  return (
    <>
      <PageSection>
        <Title headingLevel="h1" size="3xl">
          Reports
        </Title>
        <p>
          View comprehensive report for your product and their security
          analysis. Reports include CVE exploitability assessments, VEX status
          justifications, and detailed analysis summaries.
        </p>
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
