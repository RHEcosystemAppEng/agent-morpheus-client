/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

package com.redhat.ecosystemappeng.morpheus.repository;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/** Unit coverage for RPM package substring filter literals (Mongo {@code $regexMatch} input). */
class ReportRepositoryServiceTest {

    @Test
    void rpmPackageMatchRegexLiteral_quotesDotsAndHyphensForLiteralSubstring() {
        Assertions.assertEquals(".*\\Q3.1.2-14.el7\\E.*",
                ReportRepositoryService.rpmPackageMatchRegexLiteral("3.1.2-14.el7"),
                "dots and hyphens must not act as regex metacharacters");
    }

    @Test
    void rpmPackageMatchRegexLiteral_caseFoldsAscii() {
        Assertions.assertEquals(ReportRepositoryService.rpmPackageMatchRegexLiteral("LibArchive"),
                ReportRepositoryService.rpmPackageMatchRegexLiteral("libarchive"));
    }
}
