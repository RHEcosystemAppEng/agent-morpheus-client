// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { FullReport, RpmTargetPackage } from "../types/FullReport";

/** Persisted Morpheus discriminant for RPM vulnerability checks (`new-rpm-report-api`). */
export const RPM_PIPELINE_MODE = "rpm_package_checker" as const;

export function isRpmPackageCheckerReport(
  report: FullReport | undefined,
): boolean {
  return report?.input?.image?.pipeline_mode === RPM_PIPELINE_MODE;
}

export function formatRpmTargetPackageIdentity(
  pkg: RpmTargetPackage | undefined,
): string {
  if (!pkg) {
    return "";
  }
  const parts = [pkg.name, pkg.version, pkg.release, pkg.arch].filter(
    (p): p is string => Boolean(p && String(p).trim()),
  );
  return parts.join(" ");
}

/**
 * RPM NVR for Details **Package** row: `name-version-release`, only when all segments are present.
 */
export function formatRpmPackageNvr(
  pkg: RpmTargetPackage | undefined,
): string | undefined {
  if (!pkg) {
    return undefined;
  }
  const n = pkg.name?.trim();
  const v = pkg.version?.trim();
  const r = pkg.release?.trim();
  if (!n || !v || !r) {
    return undefined;
  }
  return `${n}-${v}-${r}`;
}

export interface RpmRepositoryReportSubtitleSlots {
  /** Hyphenated N-V-R, or empty if name/version/release incomplete */
  nvrSegment: string;
  /** Trimmed architecture, or empty */
  archSegment: string;
}

/** Slots matching `{CVE} | {name} | {tag}` layout for RPM checker breadcrumb/title. */
export function getRpmRepositoryReportSubtitleSlots(
  pkg: RpmTargetPackage | undefined,
): RpmRepositoryReportSubtitleSlots {
  return {
    nvrSegment: formatRpmPackageNvr(pkg) ?? "",
    archSegment: pkg?.arch?.trim() ?? "",
  };
}

/** `"{nvr} | {arch}"` with empty placeholders preserved (mirrors container name/tag pipes). */
export function formatRpmRepositoryReportSubtitleSuffix(
  pkg: RpmTargetPackage | undefined,
): string {
  const { nvrSegment, archSegment } = getRpmRepositoryReportSubtitleSlots(pkg);
  return `${nvrSegment} | ${archSegment}`;
}

/** Trimmed `report.info.checker_context.artifacts.source_url` when present (RPM checker). */
export function getRpmPackageSourceUrl(
  report: FullReport | undefined,
): string | undefined {
  const raw = report?.info?.checker_context?.artifacts?.source_url;
  if (typeof raw !== "string") {
    return undefined;
  }
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Tab title suffix: non-empty segments only, joined by ` | ` (em dash separates CVE elsewhere). */
export function formatRpmRepositoryReportDocumentTitleSuffix(
  pkg: RpmTargetPackage | undefined,
): string {
  const { nvrSegment, archSegment } = getRpmRepositoryReportSubtitleSlots(pkg);
  return [nvrSegment, archSegment].filter((s) => s !== "").join(" | ");
}

/** Heading / breadcrumb subtitle: CVE plus image refs or RPM N-V-R + arch (`rpm.json`). */
export function repositoryReportSubtitleDisplay(
  report: FullReport,
  cveId: string,
): string {
  const image = report.input?.image;
  if (isRpmPackageCheckerReport(report)) {
    return `${cveId} | ${formatRpmRepositoryReportSubtitleSuffix(image?.target_package)}`;
  }
  return `${cveId} | ${image?.name ?? ""} | ${image?.tag ?? ""}`;
}
