// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { FullReport } from "../types/FullReport";

/**
 * **`output.analysis`** row for the repository report page: **`vuln_id`** matches route **`cveId`**.
 */
export function findAnalysisRowForRouteCve(
  report: FullReport | undefined,
  routeCveId: string,
) {
  return report?.output?.analysis?.find((r) => r.vuln_id === routeCveId);
}
