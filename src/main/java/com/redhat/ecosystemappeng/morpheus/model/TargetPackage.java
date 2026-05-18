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

/** RPM package identity for Agent Morpheus RPM package checker pipeline. */
@Schema(name = "TargetPackage", description = "RPM target package descriptor for rpm_package_checker pipeline")
@JsonInclude(JsonInclude.Include.NON_EMPTY)
@RegisterForReflection
public record TargetPackage(
    @Schema(required = true) String name,
    @Schema(required = true) String version,
    @Schema(required = true) String release,
    @Schema(required = true) String arch,
    @Schema(required = true, description = "Package ecosystem", example = "rpm") String ecosystem) {

}
