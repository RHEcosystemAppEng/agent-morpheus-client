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
import java.util.Set;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;

@Schema(name = "Report", description = "Report metadata")
@RegisterForReflection
public record Report(
    @Schema(required = true, description = "Report ID (MongoDB ObjectId hex)")
    String id,
    @Schema(required = true, description = "Scan ID (input.scan.id), use for URLs and get-by-scan-id API")
    String scanId,
    @Schema(required = true, description = "Started at timestamp for report analysis")
    String startedAt,
    @Schema(required = true, description = "Completed at timestamp for report analysis")
    String completedAt,
    @Schema(required = true, description = "Image name")
    String imageName,
    @Schema(required = true, description = "Image tag")
    String imageTag,
    @Schema(required = true, description = "State of the report analysis")
    String state,
    @Schema(required = true, description = "Vulnerabilities in the report and their analysis results", type = SchemaType.ARRAY, implementation = VulnResult.class)
    Set<VulnResult> vulns,
    @Schema(required = true, description = "User provided metadata for the report")
    Map<String, String> metadata,
    @Schema(description = "Git repository URL from source_info")
    String gitRepo,
    @Schema(description = "Git reference (commit hash, tag, or branch) from source_info")
    String ref,
    @Schema(description = "Submitted at timestamp from metadata.submitted_at")
    String submittedAt) {

}
