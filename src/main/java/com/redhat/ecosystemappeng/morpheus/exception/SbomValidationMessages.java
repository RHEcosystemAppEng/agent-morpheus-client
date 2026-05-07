/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.redhat.ecosystemappeng.morpheus.exception;

import java.util.List;

/**
 * Human-readable text for {@link SbomValidationIssueCode} combinations (image SBOM metadata).
 */
public final class SbomValidationMessages {

  private SbomValidationMessages() {}

  /**
   * Summary for structured image-metadata validation failures, suitable for {@link SbomValidationException#getMessage()}
   * and API {@code error} fields.
   */
  public static String summaryForStructuredImageMetadataIssues(List<SbomValidationIssueCode> issues) {
    boolean missingUrl = issues.contains(SbomValidationIssueCode.MISSING_SOURCE_CODE_URL);
    boolean missingCommit = issues.contains(SbomValidationIssueCode.MISSING_SOURCE_COMMIT_ID);
    if (missingUrl && missingCommit) {
      return "SBOM is missing source code URL and commit ID labels.";
    }
    if (missingUrl) {
      return "SBOM is missing source code URL label.";
    }
    if (missingCommit) {
      return "SBOM is missing source code commit ID label.";
    }
    return "SBOM metadata validation failed.";
  }
}
