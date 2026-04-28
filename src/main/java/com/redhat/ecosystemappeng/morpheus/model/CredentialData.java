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

import jakarta.ws.rs.BadRequestException;
import java.util.Objects;

public interface CredentialData {
    String secretValue();

    String userName();

    default CredentialType detectType() {
        String value = secretValue().trim();
        if (value.startsWith("-----BEGIN") && value.contains("-----END")) {
            return CredentialType.SSH_KEY;
        }
        return CredentialType.PAT;
    }

    default void validate() {
        if (Objects.isNull(secretValue()) || secretValue().isBlank()) {
            throw new BadRequestException("Secret value is required");
        }
        if (detectType() == CredentialType.PAT && (Objects.isNull(userName()) || userName().isBlank())) {
            throw new BadRequestException("Username is required for PAT authentication");
        }
    }
}