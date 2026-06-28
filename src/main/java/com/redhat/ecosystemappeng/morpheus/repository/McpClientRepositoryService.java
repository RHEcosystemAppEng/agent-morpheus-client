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

package com.redhat.ecosystemappeng.morpheus.repository;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.redhat.ecosystemappeng.morpheus.model.McpClientRegistration;
import com.redhat.ecosystemappeng.morpheus.model.PaginatedResult;
import io.quarkus.runtime.annotations.RegisterForReflection;
import jakarta.annotation.PostConstruct;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import org.bson.Document;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

@Singleton
@RegisterForReflection(targets = { Document.class })
public class McpClientRepositoryService {

    private static final Logger LOGGER = Logger.getLogger(McpClientRepositoryService.class);
    private static final String COLLECTION_NAME = "mcp_clients";
    private static final String CLIENT_ID_FIELD = "client_id";
    private static final String REGISTERED_AT_FIELD = "registered_at";
    @Inject
    MongoClient mongoClient;

    @ConfigProperty(name = "quarkus.mongodb.database")
    String dbName;

    @ConfigProperty(name = "exploitiq.mcp-clients.ttl-seconds", defaultValue = "2592000")
    long clientTtlSeconds;

    @PostConstruct
    public void dbInit() {
        MongoCollection<Document> collection = getCollection();
        collection.createIndex(Indexes.ascending(CLIENT_ID_FIELD), new IndexOptions().unique(true));
        collection.createIndex(Indexes.ascending(REGISTERED_AT_FIELD),
                new IndexOptions().expireAfter(clientTtlSeconds, TimeUnit.SECONDS));
        LOGGER.info("MCP clients collection initialized with unique and TTL indexes");
    }

    public void save(McpClientRegistration registration) {
        Document doc = new Document()
                .append(CLIENT_ID_FIELD, registration.clientId())
                .append("client_name", registration.clientName())
                .append("redirect_uris", registration.redirectUris())
                .append("grant_types", registration.grantTypes())
                .append(REGISTERED_AT_FIELD, Date.from(Instant.parse(registration.registeredAt())))
                .append("client_data", new Document(registration.clientData()));
        getCollection().insertOne(doc);
    }

    public McpClientRegistration findByClientId(String clientId) {
        Document doc = getCollection().find(Filters.eq(CLIENT_ID_FIELD, clientId)).first();
        if (Objects.isNull(doc)) {
            return null;
        }
        return documentToRegistration(doc);
    }

    public boolean deleteByClientId(String clientId) {
        return getCollection().deleteOne(Filters.eq(CLIENT_ID_FIELD, clientId)).getDeletedCount() > 0;
    }

    public PaginatedResult<McpClientRegistration> findAll(int page, int pageSize) {
        MongoCollection<Document> collection = getCollection();
        long totalElements = collection.countDocuments();
        long totalPages = (totalElements + pageSize - 1) / pageSize;

        List<Document> docs = new ArrayList<>();
        collection.find()
                .skip(page * pageSize)
                .limit(pageSize)
                .into(docs);

        return new PaginatedResult<>(totalElements, totalPages,
                docs.stream().map(this::documentToRegistration));
    }

    @SuppressWarnings("unchecked")
    private McpClientRegistration documentToRegistration(Document doc) {
        Date registeredAtDate = doc.getDate(REGISTERED_AT_FIELD);
        String registeredAt = Objects.nonNull(registeredAtDate) ? registeredAtDate.toInstant().toString() : null;
        Map<String, Object> clientData = doc.get("client_data", Document.class);
        return new McpClientRegistration(
                doc.getString(CLIENT_ID_FIELD),
                doc.getString("client_name"),
                doc.getList("redirect_uris", String.class, List.of()),
                doc.getList("grant_types", String.class, List.of()),
                registeredAt,
                Objects.nonNull(clientData) ? clientData : Map.of()
        );
    }

    private MongoCollection<Document> getCollection() {
        return mongoClient.getDatabase(dbName).getCollection(COLLECTION_NAME);
    }
}