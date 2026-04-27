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