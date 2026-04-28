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

import type { FullReportImage } from "../types/FullReport";

/**
 * Builds a container image reference suitable for `podman pull`, `docker pull`, or any OCI-compatible pull.
 * Returns {@code undefined} for source-based reports (git URL in {@code name}) and bare HTTP(S) URLs that are not registry references.
 */
export function getPullImageReference(
  image: FullReportImage | undefined
): string | undefined {
  if (!image) {
    return undefined;
  }
  const name = image.name?.trim();
  if (!name) {
    return undefined;
  }
  /** Source-based reports store a git URL in {@code name}; not a container image reference. */
  if (image.analysis_type === "source" || /^https?:\/\//i.test(name)) {
    return undefined;
  }
  const tag = image.tag?.trim() ?? "";
  if (!tag) {
    return name;
  }
  if (/^sha256:[a-fA-F0-9]+$/i.test(tag)) {
    return `${name}@${tag}`;
  }
  return `${name}:${tag}`;
}
