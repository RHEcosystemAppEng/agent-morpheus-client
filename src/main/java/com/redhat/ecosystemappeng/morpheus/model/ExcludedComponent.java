/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.redhat.ecosystemappeng.morpheus.model;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

import com.fasterxml.jackson.annotation.JsonInclude;

import io.quarkus.runtime.annotations.RegisterForReflection;

@Schema(name = "ExcludedComponent", description = "Component excluded from or not completing full repository analysis")
@JsonInclude(JsonInclude.Include.NON_NULL)
@RegisterForReflection
public record ExcludedComponent(
    @Schema(required = true, description = "Component name")
    String name,
    @Schema(required = true, description = "Component version")
    String version,
    @Schema(required = true, description = "Component image or purl")
    String image,
    @Schema(
            description = "Detail when exclusionType is error; omit or null when dependency_not_present",
            nullable = true)
    String error,
    @Schema(required = true, implementation = ExclusionType.class, description = "Outcome classification")
    ExclusionType exclusionType) {
}
