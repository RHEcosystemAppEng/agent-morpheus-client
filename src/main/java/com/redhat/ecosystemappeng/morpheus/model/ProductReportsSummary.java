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

import java.util.Map;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;

@Schema(name = "ProductReportsSummary", description = "Product reports data")
@RegisterForReflection
public record ProductReportsSummary(
    @Schema(required = true, description = "Product state of analysis")
    String productState,
    @Schema(required = true, description = "Map of analysis state to count of reports with that state", type = SchemaType.OBJECT)
    Map<String, Integer> statusCounts,
    @Schema(required = true, description = "Map of justification status to count of reports with that status", type = SchemaType.OBJECT)
    Map<String, Integer> justificationStatusCounts,
    @Schema(
        required = false,
        description = "Scan id for direct navigation to the single-component report view (/reports/component/:cveId/:scanId). "
            + "Populated when metadata spdx_id is absent or blank, submittedCount is 1, exactly one report document exists for the product, and that report has a non-empty input.scan.id.")
    String singleComponentFlowScanId
) {}


