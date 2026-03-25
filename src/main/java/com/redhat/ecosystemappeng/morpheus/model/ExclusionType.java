/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
package com.redhat.ecosystemappeng.morpheus.model;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Why a component appears in {@link ExcludedComponent} instead of a completed repository report.
 */
@Schema(description = "Classification of an excluded component outcome")
@RegisterForReflection
public enum ExclusionType {
    /** Processing failure, unsupported SPDX, Exhort outage, etc. */
    @Schema(description = "Processing or analytics failure")
    error,
    /** Requested CVE not present in Exhort dependency analysis */
    @Schema(description = "CVE not present in dependency tree")
    dependency_not_present
}
