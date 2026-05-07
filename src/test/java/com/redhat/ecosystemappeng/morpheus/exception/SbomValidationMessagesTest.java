/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

package com.redhat.ecosystemappeng.morpheus.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

class SbomValidationMessagesTest {

  @Test
  void summary_missingUrlOnly() {
    assertEquals(
        "SBOM is missing source code URL label.",
        SbomValidationMessages.summaryForStructuredImageMetadataIssues(
            List.of(SbomValidationIssueCode.MISSING_SOURCE_CODE_URL)));
  }

  @Test
  void summary_missingCommitOnly() {
    assertEquals(
        "SBOM is missing source code commit ID label.",
        SbomValidationMessages.summaryForStructuredImageMetadataIssues(
            List.of(SbomValidationIssueCode.MISSING_SOURCE_COMMIT_ID)));
  }

  @Test
  void summary_missingBoth() {
    assertEquals(
        "SBOM is missing source code URL and commit ID labels.",
        SbomValidationMessages.summaryForStructuredImageMetadataIssues(
            List.of(
                SbomValidationIssueCode.MISSING_SOURCE_CODE_URL,
                SbomValidationIssueCode.MISSING_SOURCE_COMMIT_ID)));
  }

  @Test
  void summary_emptyIssues_fallback() {
    String s = SbomValidationMessages.summaryForStructuredImageMetadataIssues(List.of());
    assertTrue(s.contains("metadata validation"));
  }

  @Test
  void structuredException_messageMatchesSummary() {
    var ex =
        new SbomValidationException(List.of(SbomValidationIssueCode.MISSING_SOURCE_CODE_URL));
    assertEquals("SBOM is missing source code URL label.", ex.getMessage());
  }
}
