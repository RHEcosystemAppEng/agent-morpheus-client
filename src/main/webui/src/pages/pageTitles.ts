/**
 * Central definitions for browser tab (document) titles.
 * Use {@link withAppTitle} so every tab includes the product name.
 */

export const DOCUMENT_TITLE_APP_NAME = "Exploit Intelligence";

/** Full tab title: page-specific segment plus app name */
export function withAppTitle(pageSegment: string): string {
  return `${pageSegment} | ${DOCUMENT_TITLE_APP_NAME}`;
}

export const PAGE_TITLE_HOME = withAppTitle("Home");

export const PAGE_TITLE_REPORTS_SBOMS = withAppTitle("Reports");

export const PAGE_TITLE_REPORTS_SINGLE_REPOSITORIES = withAppTitle(
  "Reports — Single repositories"
);

export function pageTitleProductReport(
  productName: string,
  cveId: string
): string {
  return withAppTitle(`Report: ${productName} / ${cveId}`);
}

/** Repository (CVE) report: CVE plus image/repo identity from the report */
export function pageTitleRepositoryReport(
  cveId: string,
  imageName?: string,
  imageTag?: string
): string {
  const repoParts = [imageName, imageTag].filter(
    (part): part is string => Boolean(part && part.trim())
  );
  const repo = repoParts.join(" ");
  const segment = repo ? `${cveId} — ${repo}` : cveId;
  return withAppTitle(segment);
}

export function pageTitleCveDetails(cveId: string): string {
  return withAppTitle(`CVE: ${cveId.toUpperCase()}`);
}

export function pageTitleExcludedComponents(
  productName: string,
  cveId: string
): string {
  return withAppTitle(`Excluded components — ${productName} / ${cveId}`);
}

export function pageTitleRepositoryReportInvalidUrl(): string {
  return withAppTitle("Invalid repository report URL");
}

export function pageTitleRepositoryReportNotFound(reportId: string): string {
  return withAppTitle(`Report not found (${reportId})`);
}

export function pageTitleRepositoryReportLoadError(): string {
  return withAppTitle("Repository report error");
}

export function pageTitleRepositoryReportVulnNotFound(cveId: string): string {
  return withAppTitle(`Vulnerability not found — ${cveId}`);
}

export function pageTitleReportInvalidParams(): string {
  return withAppTitle("Invalid report");
}

export function pageTitleReportLoadError(): string {
  return withAppTitle("Report error");
}

export function pageTitleReportNotFound(): string {
  return withAppTitle("Report not found");
}

export function pageTitleReportLoading(
  productId: string,
  cveId: string
): string {
  return withAppTitle(`Loading Report: ${productId} / ${cveId}`);
}

export function pageTitleExcludedInvalidParams(): string {
  return withAppTitle("Invalid excluded components page");
}

export function pageTitleExcludedLoadError(): string {
  return withAppTitle("Excluded components error");
}

export function pageTitleExcludedNotFound(): string {
  return withAppTitle("Product not found");
}

/** @param routeCveId CVE segment from the route when present (e.g. malformed or empty after trim) */
export function pageTitleCveDetailsInvalid(routeCveId?: string): string {
  const id = routeCveId?.trim();
  return withAppTitle(id ? `Invalid CVE — ${id}` : "Invalid CVE");
}

export function pageTitleCveDetailsLoadError(cveId: string): string {
  return withAppTitle(`CVE details error — ${cveId.toUpperCase()}`);
}
