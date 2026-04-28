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

import java.util.stream.Stream;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public class PaginatedResult<T> {

  public final long totalElements;
  public final long totalPages;
  public final Stream<T> results;

  public PaginatedResult(long totalElements, long totalPages, Stream<T> results) {
    this.results = results;
    this.totalElements = totalElements;
    this.totalPages = totalPages;
  }
}
