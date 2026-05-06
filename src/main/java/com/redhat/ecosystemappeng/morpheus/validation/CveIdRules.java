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

package com.redhat.ecosystemappeng.morpheus.validation;

import java.util.Map;
import java.util.regex.Pattern;

import com.redhat.ecosystemappeng.morpheus.exception.CveIdValidationException;

/**
 * Single place for official CVE id validation (SPDX/CycloneDX uploads, RPM report API, etc.).
 */
public final class CveIdRules {

  private static final String FORMAT_DETAIL = "Must match the official CVE pattern CVE-YYYY-NNNN+";
  public static final String MESSAGE_REQUIRED = "CVE ID is required";
  /** Official CVE id: {@code CVE-YYYY-NNNN+}. */
  public static final Pattern OFFICIAL_CVE_PATTERN = Pattern.compile("^CVE-[0-9]{4}-[0-9]{4,19}$");

  private CveIdRules() {
  }

  /** When invalid, adds {@code errors.put("cveId", message)} consistent with {@link #validateOfficialCveOrThrow}. */
  public static void putOfficialCveFieldErrorIfInvalid(Map<String, String> errors, String cveId) {
    CveIdValidationException violation = violationFor(cveId);
    if (violation != null) {
      errors.put("cveId", violation.getMessage());
    }
  }

  private static CveIdValidationException violationFor(String cveId) {
    String trimmed = trimmedOrNull(cveId);
    if (trimmed == null) {
      return new CveIdValidationException(null, CveIdValidationException.MESSAGE_REQUIRED);
    }
    if (!OFFICIAL_CVE_PATTERN.matcher(trimmed).matches()) {
      return new CveIdValidationException(trimmed, FORMAT_DETAIL);
    }
    return null;
  }

  private static String trimmedOrNull(String s) {
    if (s == null) {
      return null;
    }
    String t = s.trim();
    return t.isEmpty() ? null : t;
  }
}
