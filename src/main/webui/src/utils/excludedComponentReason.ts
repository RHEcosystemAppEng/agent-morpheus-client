// SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.

import type { ExcludedComponent } from "../generated-client/models/ExcludedComponent";

/** User-visible Reason for Exhort CVE-not-in-dependencies gate (matches prior product wording). */
export const DEPENDENCY_NOT_PRESENT_REASON_COPY = "Vulnerable package not in dependencies";

/** Maps API `ExcludedComponent` to Reason column text: UI owns copy for dependency_not_present; error uses API `error`. */
export function excludedComponentReason(row: ExcludedComponent): string {
  if (row.exclusionType === "dependency_not_present") {
    return DEPENDENCY_NOT_PRESENT_REASON_COPY;
  }
  return row.error!;
}
