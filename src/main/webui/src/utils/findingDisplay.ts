import { apiToFindingType } from "./justificationStatus";

/**
 * Discriminated union: finding type plus optional count where applicable.
 * Used by getProductFinding / getFindingForReportRow; rendered by Finding component.
 */
export type Finding =
  | { type: "vulnerable"; count?: number }
  | { type: "not-vulnerable"; count?: number }
  | { type: "uncertain"; count?: number }
  | { type: "in-progress" }
  | { type: "failed" }
  | { type: "excluded"; count?: number };

export type ProductStatus = {
  vulnerableCount: number;
  notVulnerableCount: number;
  uncertainCount: number;
};

/** Report/analysis states that mean "in progress". */
const IN_PROGRESS_STATES = ["pending", "queued", "sent"];

/** Report/analysis states that mean "failed". */
const FAILING_STATES = ["expired", "failed"];

export function isInProgressState(state: string): boolean {
  const s = (state || "").toLowerCase();
  return IN_PROGRESS_STATES.includes(s);
}

export function isFailingState(state: string): boolean {
  const s = (state || "").toLowerCase();
  return FAILING_STATES.includes(s);
}

function hasInProgressInCounts(statusCounts: Record<string, number>): boolean {  
  return IN_PROGRESS_STATES.some((s) => (statusCounts[s] || 0) > 0);
}

function hasFailedInCounts(statusCounts: Record<string, number>): boolean {
  return FAILING_STATES.some((s) => (statusCounts[s] || 0) > 0);
}


function getExcludedCount(statusCounts: Record<string, number>): number {
  return statusCounts["excluded"] ?? 0;
}

/**
 * Returns the single prioritized finding for a product row (reports table).
 * Priority: Vulnerable > Uncertain > In progress > Failed > Excluded > Not vulnerable.
 * Only returns type + optional count; color/variant are applied by Finding component.
 * totalCount uses submittedCount (e.g. productSummary.data.submittedCount) when provided.
 * Excluded uses statusCounts["excluded"] (submission failure count from API).
 */
export function getProductFinding(
  productStatus: ProductStatus,
  analysisState: string,
  statusCounts: Record<string, number>,
  submittedCount?: number
): Finding | null {
  if (productStatus.vulnerableCount > 0) {
    return {
      type: "vulnerable",
      count: productStatus.vulnerableCount,
    };
  }
  if (productStatus.uncertainCount > 0) {
    return {
      type: "uncertain",
      count: productStatus.uncertainCount,
    };
  }
  if (hasInProgressInCounts(statusCounts)) {
    return { type: "in-progress" };
  }
  if (hasFailedInCounts(statusCounts)) {
    return { type: "failed" };
  }
  const excludedCount = getExcludedCount(statusCounts);
  if (excludedCount > 0) {
    return { type: "excluded", count: excludedCount };
  }
  if (
    analysisState === "completed" &&
    productStatus.notVulnerableCount === submittedCount
  ) {
    return { type: "not-vulnerable" };
  }
  return null;
}

/**
 * Returns the finding for a single repository report row.
 * completed + justification → vulnerable/uncertain/not-vulnerable;
 * pending|queued|sent → in-progress; expired|failed → failed.
 */
export function getFindingForReportRow(
  reportState: string,
  justificationStatus?: string
): Finding | null {
  const state = reportState || "";
  if (isInProgressState(state)) return { type: "in-progress" };
  if (isFailingState(state)) return { type: "failed" };
  if (state.toLowerCase() === "completed" && justificationStatus !== undefined) {
    const findingType = apiToFindingType(justificationStatus);
    if (findingType) return { type: findingType };
  }
  return null;
}
