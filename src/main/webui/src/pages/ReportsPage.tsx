import { useState, useMemo } from "react";
import { PageSection, Title } from "@patternfly/react-core";
import { useApi } from "../hooks/useApi";
import {
  ReportEndpointService as Reports,
  ProductSummary,
} from "../generated-client";
import ReportsTable from "../components/ReportsTable";
import { ReportsToolbarFilters } from "../components/ReportsToolbar";

const ReportsPage: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [cveSearchValue, setCveSearchValue] = useState("");
  const [filters, setFilters] = useState<ReportsToolbarFilters>({
    exploitIqStatus: [],
    analysisState: [],
  });

  const { data: productSummaries } = useApi<Array<ProductSummary>>(() =>
    Reports.getApiV1ReportsProduct()
  );

  const analysisStateOptions = useMemo(() => {
    if (!productSummaries) return [];
    const states = new Set<string>();
    productSummaries.forEach((productSummary) => {
      const productState = productSummary.summary.productState;
      if (productState && productState !== "-") {
        states.add(productState);
      }
    });
    return Array.from(states).sort();
  }, [productSummaries]);

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
