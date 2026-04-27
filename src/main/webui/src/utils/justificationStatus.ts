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

/**
 * Shared mapping between ExploitIQ/justification API values (TRUE, FALSE, UNKNOWN)
 * and display labels (Vulnerable, Not Vulnerable, Uncertain).
 * Used by filters, CveStatus, findingDisplay, and charts.
 */

export const JUSTIFICATION_API = {
  VULNERABLE: "TRUE",
  NOT_VULNERABLE: "FALSE",
  UNCERTAIN: "UNKNOWN",
} as const;

export type JustificationApiValue =
  (typeof JUSTIFICATION_API)[keyof typeof JUSTIFICATION_API];

/** Display labels for the three justification statuses (filter options, labels). */
export const JUSTIFICATION_DISPLAY_LABELS = [
  "Vulnerable",
  "Not Vulnerable",
  "Uncertain",
] as const;

/**
 * Maps display label to API value for ExploitIQ/justification status.
 */
export function displayToApi(displayLabel: string): string {
  switch (displayLabel) {
    case "Vulnerable":
      return JUSTIFICATION_API.VULNERABLE;
    case "Not Vulnerable":
      return JUSTIFICATION_API.NOT_VULNERABLE;
    case "Uncertain":
      return JUSTIFICATION_API.UNCERTAIN;
    default:
      return displayLabel.toLowerCase().replace(/\s+/g, "_");
  }
}

/**
 * Normalizes API value to uppercase; use for comparisons.
 */
export function normalizeApiValue(value: string): string {
  return (value || "").toUpperCase();
}

/**
 * Maps API value (e.g. from justification.status) to display label.
 * Accepts any case (TRUE/true → "Vulnerable").
 */
export function apiToDisplay(apiValue: string): string {
  const s = normalizeApiValue(apiValue);
  if (s === JUSTIFICATION_API.VULNERABLE) return "Vulnerable";
  if (s === JUSTIFICATION_API.NOT_VULNERABLE) return "Not Vulnerable";
  if (s === JUSTIFICATION_API.UNCERTAIN) return "Uncertain";
  return apiValue;
}

/**
 * Maps API value to PatternFly Label color for status display.
 */
export function apiToColor(
  apiValue: string
): "red" | "green" | "orange" | undefined {
  const s = normalizeApiValue(apiValue);
  if (s === JUSTIFICATION_API.VULNERABLE) return "red";
  if (s === JUSTIFICATION_API.NOT_VULNERABLE) return "green";
  if (s === JUSTIFICATION_API.UNCERTAIN) return "orange";
  return undefined;
}

/**
 * Returns finding type for a single report from its justification API value.
 * Used by getFindingForReportRow.
 */
export function apiToFindingType(
  apiValue: string
): "vulnerable" | "not-vulnerable" | "uncertain" | null {
  const s = normalizeApiValue(apiValue);
  if (s === JUSTIFICATION_API.VULNERABLE) return "vulnerable";
  if (s === JUSTIFICATION_API.NOT_VULNERABLE) return "not-vulnerable";
  if (s === JUSTIFICATION_API.UNCERTAIN) return "uncertain";
  return null;
}

/**
 * Returns count for an API key from justificationStatusCounts, case-insensitive.
 */
export function getJustificationCount(
  statusCounts: Record<string, number>,
  apiKey: JustificationApiValue
): number {
  return (
    statusCounts[apiKey] ?? statusCounts[apiKey.toLowerCase()] ?? 0
  );
}
