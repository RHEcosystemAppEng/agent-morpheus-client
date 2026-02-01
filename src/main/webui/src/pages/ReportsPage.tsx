import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { PageSection, Title } from "@patternfly/react-core";
import ReportsTable from "../components/ReportsTable";
import type { ReportsToolbarFilters } from "../components/ReportsToolbar";

const ALL_ANALYSIS_STATE_OPTIONS = [
  "completed",
  "expired",
  "failed",
  "queued",
  "sent",
  "pending",
];

const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState<string>("");
  const [cveSearchValue, setCveSearchValue] = useState<string>("");
  const [filters, setFilters] = useState<ReportsToolbarFilters>({
    exploitIqStatus: [],
    analysisState: [],
  });
  const [activeAttribute, setActiveAttribute] = useState<
    "SBOM Name" | "CVE ID" | "ExploitIQ Status" | "Analysis State"
  >("SBOM Name");

  // Restore filter state from URL on mount
  useEffect(() => {
    const sbomName = searchParams.get("sbomName") || "";
    const cveId = searchParams.get("cveId") || "";
    // TODO: exploitIqStatus filter not yet implemented - parameter is ignored
    // const exploitIqStatus = searchParams.get("exploitIqStatus") || "";
    const analysisState = searchParams.get("analysisState") || "";

    setSearchValue(sbomName);
    setCveSearchValue(cveId);

    // Parse comma-separated values
    // TODO: ExploitIQ Status filter - NOT YET IMPLEMENTED
    // The filter appears in the UI but is disabled and has no backend implementation.
    setFilters({
      exploitIqStatus: [],
      analysisState: analysisState
        ? analysisState.split(",").map((v) => v.trim())
        : [],
    });
  }, []); // Only on mount

  // Update URL when filters change
  const updateUrlParams = (
    sbomName: string,
    cveId: string,
    exploitIqStatus: string[], // TODO: Not yet implemented - parameter is ignored
    analysisState: string[]
  ) => {
    const newParams = new URLSearchParams();
    if (sbomName) newParams.set("sbomName", sbomName);
    if (cveId) newParams.set("cveId", cveId);
    // TODO: ExploitIQ Status filter
    if (analysisState.length > 0) {
      newParams.set("analysisState", analysisState.join(","));
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    updateUrlParams(
      value,
      cveSearchValue,
      filters.exploitIqStatus,
      filters.analysisState
    );
  };

  const handleCveSearchChange = (value: string) => {
    setCveSearchValue(value);
    updateUrlParams(
      searchValue,
      value,
      filters.exploitIqStatus,
      filters.analysisState
    );
  };

  const handleFiltersChange = (newFilters: ReportsToolbarFilters) => {
    setFilters(newFilters);
    updateUrlParams(
      searchValue,
      cveSearchValue,
      newFilters.exploitIqStatus,
      newFilters.analysisState
    );
  };

  const handleClearFilters = () => {
    setSearchValue("");
    setCveSearchValue("");
    setFilters({ exploitIqStatus: [], analysisState: [] });
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
          analysisStateOptions={ALL_ANALYSIS_STATE_OPTIONS}
        />
      </PageSection>
    </>
  );
};

export default ReportsPage;
