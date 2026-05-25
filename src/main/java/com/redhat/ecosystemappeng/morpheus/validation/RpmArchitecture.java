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

import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * Allowed RPM target architectures for {@code POST /api/v1/reports/new-rpm-report}
 * (aligned with Request Analysis RPM UI).
 */
@RegisterForReflection
public enum RpmArchitecture {
  X86_64("x86_64"),
  AMD64("amd64"),
  AARCH64("aarch64"),
  ARM64("arm64"),
  PPC64LE("ppc64le"),
  S390X("s390x");

  public static final String MESSAGE_NOT_ALLOWED =
      "Architecture must be one of: x86_64, amd64, aarch64, arm64, ppc64le, s390x";

  private final String wireValue;

  RpmArchitecture(String wireValue) {
    this.wireValue = wireValue;
  }

  public String wireValue() {
    return wireValue;
  }

  /** {@code true} when {@code trimmedNonEmpty} equals a {@link #wireValue()} (case-sensitive). */
  public static boolean isAllowed(String trimmedNonEmpty) {
    if (trimmedNonEmpty == null || trimmedNonEmpty.isEmpty()) {
      return false;
    }
    for (RpmArchitecture arch : values()) {
      if (arch.wireValue.equals(trimmedNonEmpty)) {
        return true;
      }
    }
    return false;
  }

  /** When invalid, adds {@code errors.put("arch", message)} after required-field checks. */
  public static void putArchFieldErrorIfNotAllowed(Map<String, String> errors, String arch) {
    if (arch != null && !isAllowed(arch)) {
      errors.put("arch", MESSAGE_NOT_ALLOWED);
    }
  }
}
