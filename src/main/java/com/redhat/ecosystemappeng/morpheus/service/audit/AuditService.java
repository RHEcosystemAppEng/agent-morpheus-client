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

package com.redhat.ecosystemappeng.morpheus.service.audit;

import org.eclipse.microprofile.config.inject.ConfigProperty;

public class AuditService {

  public static final int THRESHOLD_NUMBER_OF_DB_ITEMS_FOR_PARALLEL_PROCESSING = 100;
  public static final String REGEX_PATTERN_FOR_CVE = "CVE-\\d{4}-\\d{4,7}";
  public static final String REGEX_ALLOWED_LANGUAGES = "go|python|c|javascript|java|all|\\s*";

    @ConfigProperty(name = "exploitiq.audit.list-api.blank-list.error", defaultValue = "false")
    protected Boolean apiBlankListResultReturnsError;
}
