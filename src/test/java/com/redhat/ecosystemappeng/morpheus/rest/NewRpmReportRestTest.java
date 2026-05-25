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

package com.redhat.ecosystemappeng.morpheus.rest;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.equalTo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.redhat.ecosystemappeng.morpheus.exception.CveIdValidationException;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.PipelineMode;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

/**
 * {@code POST /api/v1/reports/new-rpm-report} ({@link io.quarkus.test.junit.QuarkusTest}).
 */
@QuarkusTest
class NewRpmReportRestTest {

    private static final String PATH = "/api/v1/reports/new-rpm-report";
    /** Aligns with devservices fixture {@code src/test/resources/devservices/reports/rpm.json}. */
    private static final String VALID_CVE = "CVE-2016-8687";

    @BeforeEach
    void configureRestAssured() {
        RestApiTestFixture.configureRestAssuredIfExternal();
    }

    @Test
    void acceptedReportHasRpmCheckerInputAndNormalizedCve() {
        Map<String, String> body = baseValidBody();

        String reportId = RestAssured.given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
            .post(PATH)
            .then()
            .statusCode(202)
            .contentType(ContentType.JSON)
            .extract()
            .path("reportRequestId.id");

        RestAssured.given()
            .when()
            .get("/api/v1/reports/" + reportId)
            .then()
            .statusCode(200)
            .body("report.input.image.pipeline_mode", equalTo(PipelineMode.RPM_PACKAGE_CHECKER.toString()))
            .body("report.input.image.analysis_type", equalTo("source"))
            .body("report.input.image.source_info", equalTo(null))
            .body("report.input.image.target_package.name", equalTo("libarchive"))
            .body("report.input.image.target_package.version", equalTo("3.1.2"))
            .body("report.input.image.target_package.release", equalTo("14.el7_9.1"))
            .body("report.input.image.target_package.arch", equalTo("x86_64"))
            .body("report.input.image.target_package.ecosystem", equalTo("rpm"))
            .body("report.input.scan.vulns[0].vuln_id", equalTo("CVE-2016-8687"));
    }

    @Test
    void missingNameReturns400WithErrorsWrapper() {
        Map<String, String> body = baseValidBody();
        body = Map.of(
            "name", "",
            "version", body.get("version"),
            "release", body.get("release"),
            "arch", body.get("arch"),
            "cveId", body.get("cveId"));

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
            .post(PATH)
            .then()
            .statusCode(400)
            .body("errors.name", equalTo("Name is required"));
    }

    @Test
    void invalidCveFormatReturns400AlignedWithUploadSpdx() {
        Map<String, String> body = new HashMap<>(baseValidBody());
        body.put("cveId", "not-a-cve");

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
            .post(PATH)
            .then()
            .statusCode(400)
            .body("errors.cveId",
                equalTo("Invalid CVE ID: not-a-cve. Must match the official CVE pattern CVE-YYYY-NNNN+"));
    }

    @Test
    void missingCveIdKeyReturns400() {
        Map<String, String> body = new HashMap<>();
        body.put("name", "libarchive");
        body.put("version", "3.1.2");
        body.put("release", "14.el7_9.1");
        body.put("arch", "x86_64");

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
            .post(PATH)
            .then()
            .statusCode(400)
            .body("errors.cveId", equalTo(CveIdValidationException.MESSAGE_REQUIRED));
    }

    @Test
    void multipleFieldErrorsAggregated() {
        Map<String, String> body = Map.of(
            "name", "libarchive",
            "version", "1",
            "release", "   ",
            "arch", "x86_64",
            "cveId", "bad");

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
            .post(PATH)
            .then()
            .statusCode(400)
            .body("errors.release", equalTo("Release is required"))
            .body("errors.cveId",
                equalTo("Invalid CVE ID: bad. Must match the official CVE pattern CVE-YYYY-NNNN+"));
    }

    @Test
    void invalidArchitectureReturns400WithFieldMapping() {
        Map<String, String> body = new HashMap<>(baseValidBody());
        body.put("arch", "i686");

        RestAssured.given()
            .contentType(ContentType.JSON)
            .body(body)
            .when()
            .post(PATH)
            .then()
            .statusCode(400)
            .body("errors.arch", equalTo("Architecture must be one of: x86_64, amd64, aarch64, arm64, ppc64le, s390x"));
    }

    private static Map<String, String> baseValidBody() {
        return Map.of(
            "name", "libarchive",
            "version", "3.1.2",
            "release", "14.el7_9.1",
            "arch", "x86_64",
            "cveId", VALID_CVE);
    }
}
