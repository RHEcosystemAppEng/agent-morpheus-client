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

package com.redhat.ecosystemappeng.morpheus.model.morpheus;

import java.util.Collection;

import com.fasterxml.jackson.annotation.JsonProperty;

import io.quarkus.runtime.annotations.RegisterForReflection;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(name = "SourceInfo", description = "Source code information")
@RegisterForReflection
public record SourceInfo(
    @Schema(required = true, description = "Type of source code (code|doc)")
    String type, 
    @Schema(required = true, description = "Git repository URL")
    @JsonProperty("git_repo") String gitRepo, 
    @Schema(required = true, description = "Git reference (commit hash, tag, or branch)")
    String ref, 
    @Schema(required = true, description = "Patterns to include in the analysis")
    Collection<String> include, 
    @Schema(required = true, description = "Patterns to exclude from the analysis")
    Collection<String> exclude) {
  
}
