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

package com.redhat.ecosystemappeng.morpheus.model;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

import com.fasterxml.jackson.annotation.JsonInclude;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** JSON body for {@code POST /api/v1/reports/new-rpm-report}. */
@Schema(name = "NewRpmReportRequest", description = "RPM package plus CVE for new analysis request")
@JsonInclude(JsonInclude.Include.NON_EMPTY)
@RegisterForReflection
public record NewRpmReportRequest(
    @Schema(required = true, description = "RPM package name") String name,
    @Schema(required = true, description = "RPM package version") String version,
    @Schema(required = true, description = "RPM package release") String release,
    @Schema(required = true, description = "RPM architecture") String arch,
    @Schema(required = true, description = "Vulnerability identifier (CVE-YYYY-NNNN+)", example = "CVE-2024-12345") String cveId) {

}
