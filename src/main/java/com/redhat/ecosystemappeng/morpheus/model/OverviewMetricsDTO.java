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

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@RegisterForReflection
@Schema(name = "OverviewMetrics", description = "Metrics for the home page calculated from data in the last week")
public record OverviewMetricsDTO(
    @Schema(description = "The count of reports that were completed in the last week (reports with completed_at not null and date within last 7 days)")
    double successfullyAnalyzed,

    @Schema(description = "The average reliability score (intel_score) calculated as sum of all intel_score values divided by the count of completed reports from the last week")
    double averageReliabilityScore,

    @Schema(description = "The percentage of false positives identified from completed reports in the last week, calculated as (reports with output.analysis.0.justification.status='FALSE' / total completed reports) * 100")
    double falsePositiveRate
) {}