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

import com.fasterxml.jackson.annotation.JsonValue;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(name = "SbomInfoType", description = "SBOM information type")
public enum SbomInfoType {
  MANUAL ("manual"),
  CYCLONEDX_JSON ("cyclonedx+json");

  @JsonValue
  final String name;

  SbomInfoType(String name) {
    this.name = name;
  }

  @Override
  public String toString() {
    return name;
  }
}
