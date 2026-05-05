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
 * Exception thrown when SBOM validation fails
 */
public class SbomValidationException extends IllegalArgumentException {

  private final List<SbomValidationIssueCode> structuredIssues;

  public SbomValidationException(String message) {
    super(message);
    this.structuredIssues = List.of();
  }

  public SbomValidationException(String message, Throwable cause) {
    super(message, cause);
    this.structuredIssues = List.of();
  }

  public SbomValidationException(List<SbomValidationIssueCode> structuredIssues) {
    super(SbomValidationMessages.summaryForStructuredImageMetadataIssues(structuredIssues));
    this.structuredIssues = List.copyOf(structuredIssues);
  }

  public List<SbomValidationIssueCode> getStructuredIssues() {
    return structuredIssues;
  }

  public boolean hasStructuredIssues() {
    return !structuredIssues.isEmpty();
  }
}

