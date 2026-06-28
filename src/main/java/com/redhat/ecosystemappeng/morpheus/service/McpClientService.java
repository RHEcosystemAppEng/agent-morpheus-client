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

package com.redhat.ecosystemappeng.morpheus.service;

import com.mongodb.ErrorCategory;
import com.mongodb.MongoWriteException;
import com.redhat.ecosystemappeng.morpheus.model.McpClientRegistration;
import com.redhat.ecosystemappeng.morpheus.model.PaginatedResult;
import com.redhat.ecosystemappeng.morpheus.exception.McpClientAlreadyExistsException;
import com.redhat.ecosystemappeng.morpheus.repository.McpClientRepositoryService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class McpClientService {

    private static final Logger LOGGER = Logger.getLogger(McpClientService.class);

    private final McpClientRepositoryService repository;

    @Inject
    public McpClientService(McpClientRepositoryService repository) {
        this.repository = repository;
    }

    public McpClientRegistration register(McpClientRegistration registration) {
        LOGGER.infof("Registering MCP client: clientId=%s, clientName=%s",
                registration.clientId(), registration.clientName());
        try {
            repository.save(registration);
            return registration;
        } catch (MongoWriteException e) {
            if (e.getError().getCategory() == ErrorCategory.DUPLICATE_KEY) {
                LOGGER.warnf("Duplicate MCP client registration: clientId=%s", registration.clientId());
                throw new McpClientAlreadyExistsException(registration.clientId());
            }
            throw e;
        }
    }

    public McpClientRegistration getByClientId(String clientId) {
        LOGGER.debugf("Looking up MCP client: clientId=%s", clientId);
        return repository.findByClientId(clientId);
    }

    public PaginatedResult<McpClientRegistration> list(int page, int pageSize) {
        LOGGER.debugf("Listing MCP clients: page=%d, pageSize=%d", page, pageSize);
        return repository.findAll(page, pageSize);
    }

    public boolean delete(String clientId) {
        LOGGER.infof("Deleting MCP client: clientId=%s", clientId);
        return repository.deleteByClientId(clientId);
    }
}