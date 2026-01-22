import { useState, useMemo } from "react";
import { PageSection, Title } from "@patternfly/react-core";
import { usePaginatedApi } from "../hooks/usePaginatedApi";
import type { Product } from "../generated-client/models/Product";
import ReportsTable from "../components/ReportsTable";
import { ReportsToolbarFilters } from "../components/ReportsToolbar";

const ReportsPage: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [cveSearchValue, setCveSearchValue] = useState("");
  const [filters, setFilters] = useState<ReportsToolbarFilters>({
    exploitIqStatus: [],
    analysisState: [],
  });

  // Fetch products to get analysis state options
  const { data: products } = usePaginatedApi<Array<Product>>(
    () => ({
      method: "GET",
      url: "/api/v1/products",
      query: {
        page: 0,
        pageSize: 1000, // Get all products for state options
      },
    }),
    {
      deps: [],
    }
  );

  const analysisStateOptions = useMemo(() => {
    if (!products) return [];
    const states = new Set<string>();
    products.forEach((product) => {
      const statusCounts = product.statusCounts || {};
      Object.keys(statusCounts).forEach((state) => {
        if (state && state !== "-") {
          states.add(state);
        }
      });
    });
    return Array.from(states).sort();
  }, [products]);

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
          onSearchChange={setSearchValue}
          cveSearchValue={cveSearchValue}
          onCveSearchChange={setCveSearchValue}
          filters={filters}
          onFiltersChange={setFilters}
          analysisStateOptions={analysisStateOptions}
        />
      </PageSection>
    </>
  );
};

export default ReportsPage;
