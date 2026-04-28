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

package com.redhat.ecosystemappeng.morpheus.config;

import java.util.List;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;
import io.smallrye.config.WithName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import io.quarkus.runtime.annotations.StaticInitSafe;

@StaticInitSafe
@ConfigMapping(prefix = "exploit-iq")
public interface AppConfig {
    Image image();

    interface Image {
        Source source();
        interface Source {
            @WithName("location-keys")
            @WithDefault("image.source-location")
            @Size(min = 1, max = 10)
            List<@NotBlank @Pattern(regexp = "^[a-zA-Z0-9.:_/-]+$", message = "Invalid key format") String> locationKeys();

            @WithName("commit-id-keys")
            @WithDefault("image.source.commit-id")
            @Size(min = 1, max = 10)
            List<@NotBlank @Pattern(regexp = "^[a-zA-Z0-9.:_/-]+$", message = "Invalid key format") String> commitIdKeys();
        }
    }
}