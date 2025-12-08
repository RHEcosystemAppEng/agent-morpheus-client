import { useMemo } from 'react';
import { useApi } from './useApi';
import {
  ReportEndpointService as Reports,
  ProductSummary,
} from '../generated-client';
import { ReportsToolbarFilters } from '../components/ReportsToolbar';

export type ProductStatus = {
  status: "vulnerable" | "not_vulnerable" | "unknown";
  vulnerableCount: number;
  totalCount: number;
};

export interface ReportRow {
  productId: string;
  sbomName: string;
  cveId: string;
  exploitIqStatus: string;
  exploitIqLabel: string;
  completedAt: string;
  analysisState: string;
  productStatus: ProductStatus;
}

export type SortDirection = "asc" | "desc";

export interface UseReportsTableOptions {
  searchValue: string;
  cveSearchValue: string;
  filters: ReportsToolbarFilters;
  sortDirection: SortDirection;
}

export interface UseReportsTableResult {
  rows: ReportRow[];
  loading: boolean;
  error: Error | null;
}

/**
 * Pure function to calculate product status from a product summary
 */
export function calculateProductStatus(
  productSummary: ProductSummary
): ProductStatus {
  const cves = productSummary.summary.cves || {};
  const cveIds = Object.keys(cves);
  const cveCount = cveIds.length;
  const submittedCount = productSummary.data.submittedCount || 0;

  let vulnerableCount = 0;

  // Count vulnerable CVEs
  cveIds.forEach((cveId) => {
    const justifications = cves[cveId] || [];
    const hasVulnerable = justifications.some(
      (j) => j.status === "true" || j.label === "vulnerable"
    );
    if (hasVulnerable) {
      vulnerableCount++;
    }
  });

  // Determine overall status
  if (vulnerableCount > 0) {
    return {
      status: "vulnerable",
      vulnerableCount,
      totalCount: submittedCount,
    };
  }

  // Check if all components were analyzed
  if (cveCount === submittedCount) {
    // All analyzed and none are vulnerable
    return {
      status: "not_vulnerable",
      vulnerableCount: 0,
      totalCount: submittedCount,
    };
  }

  // CVE count doesn't match submission count or incomplete
  return {
    status: "unknown",
    vulnerableCount,
    totalCount: submittedCount,
  };
}

/**
 * Pure function to format status label
 */
export function formatStatusLabel(productStatus: ProductStatus): string {
  if (productStatus.status === "vulnerable") {
    return `${productStatus.vulnerableCount}/${productStatus.totalCount} Vulnerable`;
  }
  if (productStatus.status === "not_vulnerable") {
    return "not vulnerable";
  }
  return "status unknown";
}

/**
 * Pure function to transform product summaries into report rows
 */
export function transformProductSummariesToRows(
  productSummaries: ProductSummary[]
): ReportRow[] {
  const rows: ReportRow[] = [];

  productSummaries.forEach((productSummary) => {
    const productId = productSummary.data.id;
    const sbomName = productSummary.data.name || "-";
    const completedAt = productSummary.data.completedAt || "";
    const analysisState = productSummary.summary.productState || "-";
    const cves = productSummary.summary.cves || {};

    // Calculate product-level status
    const productStatus = calculateProductStatus(productSummary);

    // Create a row for each CVE
    const cveIds = Object.keys(cves);
    if (cveIds.length > 0) {
      cveIds.forEach((cveId) => {
        const justifications = cves[cveId] || [];
        // Use the first justification if multiple exist
        const justification = justifications[0] || {
          status: "unknown",
          label: "uncertain",
        };
        rows.push({
          productId,
          sbomName,
          cveId,
          exploitIqStatus: justification.status || "unknown",
          exploitIqLabel: justification.label || "uncertain",
          completedAt,
          analysisState,
          productStatus,
        });
      });
    } else {
      // If no CVEs, create a single row with empty CVE
      rows.push({
        productId,
        sbomName,
        cveId: "-",
        exploitIqStatus: "unknown",
        exploitIqLabel: "uncertain",
        completedAt,
        analysisState,
        productStatus,
      });
    }
  });

  return rows;
}

/**
 * Pure function to filter and sort report rows
 */
export function filterAndSortReportRows(
  rows: ReportRow[],
  searchValue: string,
  cveSearchValue: string,
  filters: ReportsToolbarFilters,
  sortDirection: SortDirection
): ReportRow[] {
  let filtered = rows;

  // Apply SBOM name search filter
  if (searchValue.trim()) {
    const searchLower = searchValue.toLowerCase().trim();
    filtered = filtered.filter((row) =>
      row.sbomName.toLowerCase().includes(searchLower)
    );
  }

  // Apply CVE ID search filter
  if (cveSearchValue.trim()) {
    const searchLower = cveSearchValue.toLowerCase().trim();
    filtered = filtered.filter((row) =>
      row.cveId.toLowerCase().includes(searchLower)
    );
  }

  // Apply ExploitIQ status filter
  if (filters.exploitIqStatus.length > 0) {
    filtered = filtered.filter((row) => {
      const formattedLabel = formatStatusLabel(row.productStatus);
      return filters.exploitIqStatus.includes(formattedLabel);
    });
  }

  // Apply Analysis state filter
  if (filters.analysisState.length > 0) {
    filtered = filtered.filter((row) =>
      filters.analysisState.includes(row.analysisState)
    );
  }

  // Apply sorting by completedAt
  filtered = [...filtered].sort((a, b) => {
    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;

    if (sortDirection === "desc") {
      return dateB - dateA; // Newest first
    } else {
      return dateA - dateB; // Oldest first
    }
  });

  return filtered;
}

/**
 * Hook to fetch reports and process them for the reports table
 * Follows Rule VI: Complex data processing logic is encapsulated in a custom hook
 * with separate pure functions for data transformation
 */
export function useReportsTableData(
  options: UseReportsTableOptions
): UseReportsTableResult {
  const { searchValue, cveSearchValue, filters, sortDirection } = options;

  // Fetch product summaries using the generated API client
  const { data: productSummaries, loading, error } = useApi<Array<ProductSummary>>(
    () => Reports.getApiReportsProduct()
  );

  // Transform and process the data
  const rows = useMemo(() => {
    if (!productSummaries) {
      return [];
    }

    // Transform product summaries to rows
    const transformedRows = transformProductSummariesToRows(productSummaries);

    // Filter and sort the rows
    return filterAndSortReportRows(
      transformedRows,
      searchValue,
      cveSearchValue,
      filters,
      sortDirection
    );
  }, [productSummaries, searchValue, cveSearchValue, filters, sortDirection]);

  return {
    rows,
    loading,
    error,
  };
}

