import type { ProductSummary } from "../generated-client/models/ProductSummary";

/**
 * Result of getRepositoriesAnalyzedFromProduct: completed count, submitted count, and a display getter.
 */
export type RepositoriesAnalyzedInfo = {
  completed: number;
  submittedCount: number;
  getDisplay: (suffix?: string) => string;
};

/**
 * Shared utility: accepts product (data + summary) and returns repositories-analyzed info.
 * Completed from summary.statusCounts["completed"], submitted from data.submittedCount.
 * getDisplay(suffix) returns "{completed}/{submitted}" with optional suffix (e.g. "analyzed").
 */
export function getRepositoriesAnalyzedFromProduct(
  product: ProductSummary
): RepositoriesAnalyzedInfo {
  const completed = product.summary?.statusCounts?.["completed"] ?? 0;
  const submittedCount = product.data?.submittedCount ?? 0;
  return {
    completed,
    submittedCount,
    getDisplay: (suffix = "") =>
      suffix ? `${completed}/${submittedCount} ${suffix}` : `${completed}/${submittedCount}`,
  };
}