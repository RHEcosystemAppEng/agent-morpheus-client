/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

package com.redhat.ecosystemappeng.morpheus.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;

import com.redhat.ecosystemappeng.morpheus.service.RepositoryConstants;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;

/** Ensures {@link ReportRepositoryService#toReport(Document)} maps {@code componentDependencyTriageFailed}. */
@QuarkusTest
class ReportRepositoryServiceToReportTest {

    @Inject
    ReportRepositoryService reportRepositoryService;

    @Test
    void toReport_defaultsComponentDependencyTriageFailedWhenAbsent() {
        Document doc = minimalReportDocument();
        var report = reportRepositoryService.toReport(doc);
        assertEquals(Boolean.FALSE, report.componentDependencyTriageFailed());
    }

    @Test
    void toReport_readsComponentDependencyTriageFailedTrue() {
        Document doc = minimalReportDocument();
        doc.append("componentDependencyTriageFailed", true);
        var report = reportRepositoryService.toReport(doc);
        assertEquals(Boolean.TRUE, report.componentDependencyTriageFailed());
    }

    @Test
    void toReport_ignoresLegacyReportFieldDependencyTriageUnavailable() {
        Document doc = minimalReportDocument();
        doc.append("dependencyTriageUnavailable", true);
        var report = reportRepositoryService.toReport(doc);
        assertEquals(Boolean.FALSE, report.componentDependencyTriageFailed());
    }

    private static Document minimalReportDocument() {
        Document scan = new Document()
            .append(RepositoryConstants.SCAN_ID, "scan-test")
            .append("started_at", "2025-01-01T00:00:00")
            .append("completed_at", "2025-01-02T00:00:00")
            .append("vulns", List.of(new Document("vuln_id", "CVE-2024-1")));
        Document image = new Document()
            .append("name", "img")
            .append("tag", "1")
            .append("source_info", List.of(new Document("type", "code")
                .append("git_repo", "https://github.com/example/r")
                .append("ref", "main")));
        Document input = new Document()
            .append("scan", scan)
            .append("image", image);
        // Omit top-level `metadata` so extractMetadata skips (empty Document can still carry
        // driver-specific entries that break date parsing for submitted_at/sent_at).
        return new Document()
            .append(RepositoryConstants.ID_KEY, new ObjectId())
            .append("input", input);
    }
}
