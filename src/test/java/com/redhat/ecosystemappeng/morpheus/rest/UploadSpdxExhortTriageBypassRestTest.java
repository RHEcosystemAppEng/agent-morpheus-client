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

import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.notNullValue;

import java.io.File;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;

/**
 * When Exhort health is unavailable, SPDX whole-product processing skips the CVE dependency gate
 * and persists {@code dependencyTriageUnavailable} on the product.
 */
@QuarkusTest
@TestProfile(ExhortHealthDownProfile.class)
public class UploadSpdxExhortTriageBypassRestTest {

    private static final String TEST_SBOM_FILE = "src/test/resources/devservices/spdx-sboms/gitops-1.19-stripped.json";
    private static final String TEST_VULN_ID = "CVE-2007-4559";
    private static final int GITOPS_119_EXPECTED_SUBMITTED_COUNT = 10;

    @Test
    void testUpload_ExhortUnhealthy_SetsFlagAndBypassesDependencyGate() {
        File sbomFile = new File(TEST_SBOM_FILE);

        String productId = RestAssured.given()
            .contentType(ContentType.MULTIPART)
            .multiPart("cveId", TEST_VULN_ID)
            .multiPart("file", sbomFile)
            .when()
            .post("/api/v1/products/upload-spdx")
            .then()
            .statusCode(202)
            .contentType(ContentType.JSON)
            .body("productId", notNullValue())
            .extract()
            .path("productId");

        Assertions.assertNotNull(productId);
        RestApiTestFixture.awaitSpdxProductProcessingComplete(productId);

        RestAssured.given()
            .when()
            .get("/api/v1/products/" + productId)
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("data.dependencyTriageUnavailable", equalTo(true))
            .body("data.submittedCount", equalTo(GITOPS_119_EXPECTED_SUBMITTED_COUNT))
            .body("data.excludedComponents", empty());

        RestAssured.given()
            .queryParam("productId", productId)
            .queryParam("pageSize", 1)
            .when()
            .get("/api/v1/reports")
            .then()
            .statusCode(200)
            .header("X-Total-Elements", String.valueOf(GITOPS_119_EXPECTED_SUBMITTED_COUNT));

        RestAssured.given()
            .queryParam("productId", productId)
            .queryParam("pageSize", 100)
            .when()
            .get("/api/v1/reports")
            .then()
            .statusCode(200)
            .body("componentDependencyTriageFailed", everyItem(equalTo(false)));
    }
}
