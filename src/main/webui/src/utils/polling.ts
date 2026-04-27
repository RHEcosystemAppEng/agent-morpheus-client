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
 * Shared constants and utilities for polling/auto-refresh functionality
 */

import { ProductSummary } from "../generated-client";

/**
 * Default polling interval for auto-refresh (5 seconds)
 * Used for report pages and repository reports tables
 */
export const POLL_INTERVAL_MS = 5000;

/**
 * Polling interval for reports table (15 seconds)
 * Used for the main reports table which shows aggregated product data
 */
export const REPORTS_TABLE_POLL_INTERVAL_MS = 15000;

/**
 * Pure function to determine if polling should continue based on statusCounts.
 * Returns true if there are any analysis states that are not "failed" or "completed".
 * 
 * @param statusCounts - Record mapping state names to counts
 * @returns true if polling should continue, false otherwise
 */
export function shouldContinuePollingByProductState(
  product: ProductSummary
): boolean {
  return product.summary.productState !== "completed";
}

