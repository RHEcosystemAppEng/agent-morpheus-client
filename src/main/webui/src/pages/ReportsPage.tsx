import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router";
import { PageSection, Title } from "@patternfly/react-core";
import ReportsTable from "../components/ReportsTable";
import type { ReportsToolbarFilters } from "../components/ReportsToolbar";
import type { SortColumn, SortDirection } from "../hooks/useReportsTableData";

const DEBOUNCE_DELAY_MS = 500;

const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState<string>("");
  const [cveSearchValue, setCveSearchValue] = useState<string>("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>("");
  const [debouncedCveSearchValue, setDebouncedCveSearchValue] =
    useState<string>("");
  const [filters, setFilters] = useState<ReportsToolbarFilters>({});
  const [activeAttribute, setActiveAttribute] = useState<
    "SBOM Name" | "CVE ID"
  >("SBOM Name");
  const [sortColumn, setSortColumn] = useState<SortColumn>("completedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sbomSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cveSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sbomName = searchParams.get("sbomName") || "";
    const cveId = searchParams.get("cveId") || "";
    const sortField = searchParams.get("sortField");
    const sortDir = searchParams.get("sortDirection");

    setSearchValue(sbomName);
    setDebouncedSearchValue(sbomName);
    setCveSearchValue(cveId);
    setDebouncedCveSearchValue(cveId);

    setFilters({});

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

  useEffect(() => {
    if (sbomSearchTimeoutRef.current) {
      clearTimeout(sbomSearchTimeoutRef.current);
    }

    sbomSearchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, DEBOUNCE_DELAY_MS);

    return () => {
      if (sbomSearchTimeoutRef.current) {
        clearTimeout(sbomSearchTimeoutRef.current);
      }
    };
  }, [searchValue]);

  useEffect(() => {
    if (cveSearchTimeoutRef.current) {
      clearTimeout(cveSearchTimeoutRef.current);
    }

    cveSearchTimeoutRef.current = setTimeout(() => {
      setDebouncedCveSearchValue(cveSearchValue);
    }, DEBOUNCE_DELAY_MS);

    return () => {
      if (cveSearchTimeoutRef.current) {
        clearTimeout(cveSearchTimeoutRef.current);
      }
    };
  }, [cveSearchValue]);

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
    // Only add sort params if not default (completedAt DESC)
    if (currentSortCol !== "completedAt" || currentSortDir !== "desc") {
      newParams.set("sortField", currentSortCol);
      newParams.set("sortDirection", currentSortDir);
    }
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    updateUrlParams(debouncedSearchValue, debouncedCveSearchValue);
  }, [debouncedSearchValue, debouncedCveSearchValue]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleCveSearchChange = (value: string) => {
    setCveSearchValue(value);
  };

  const handleFiltersChange = (newFilters: ReportsToolbarFilters) => {
    setFilters(newFilters);
    updateUrlParams(debouncedSearchValue, debouncedCveSearchValue);
  };

  const handleSortChange = (column: SortColumn, direction: SortDirection) => {
    setSortColumn(column);
    setSortDirection(direction);
    updateUrlParams(
      debouncedSearchValue,
      debouncedCveSearchValue,
      column,
      direction
    );
  };

  const handleClearFilters = () => {
    setSearchValue("");
    setCveSearchValue("");
    setDebouncedSearchValue("");
    setDebouncedCveSearchValue("");
    setFilters({});
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
          searchValue={debouncedSearchValue}
          cveSearchValue={debouncedCveSearchValue}
          displaySearchValue={searchValue}
          displayCveSearchValue={cveSearchValue}
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
