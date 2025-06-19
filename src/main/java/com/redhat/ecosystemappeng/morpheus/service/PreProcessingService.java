package com.redhat.ecosystemappeng.morpheus.service;

import java.util.List;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.redhat.ecosystemappeng.morpheus.client.ComponentSyncerService;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class PreProcessingService {

  private static final Logger LOGGER = Logger.getLogger(PreProcessingService.class);

  @Inject
  ObjectMapper objectMapper;

  @RestClient
  ComponentSyncerService componentSyncerService;

  public JsonNode parse(List<JsonNode> payloads) throws IOException {
    LOGGER.debug("Parse Morpheus payloads for pre-processing");

    InputStream is = getClass().getClassLoader().getResourceAsStream("preProcessingTemplate.json");
    if (is == null) {
        throw new IllegalArgumentException("Template file not found in resources.");
    }
    ObjectNode templateJson = (ObjectNode) objectMapper.readTree(is);

    templateJson.put("id", UUID.randomUUID().toString());

    ArrayNode dataArray = objectMapper.createArrayNode();

    for (JsonNode payload : payloads) {
      JsonNode scanId = payload.at("/input/scan/id");
      JsonNode sourceInfo = payload.at("/input/image/source_info");

      if (!scanId.isMissingNode() && !sourceInfo.isMissingNode()) {
          ObjectNode dataEntry = objectMapper.createObjectNode();
          dataEntry.set("scan_id", scanId);
          dataEntry.set("source_info", sourceInfo);
          dataArray.add(dataEntry);
      }
    }

    templateJson.set("data", dataArray);

    return templateJson;
  }

  public JsonNode submit(JsonNode request) throws IOException {
    try {
      Response response = componentSyncerService.submit(request);
      LOGGER.debug("Requests sent to Component Syncer for pre-processing");

      return new ObjectMapper().readTree(response.readEntity(String.class));
    } catch (Exception e) {
      LOGGER.error("Unable to submit requests to Component Syncer for pre-processing", e);
      throw new IOException("Component Syncer failed", e);
    }
  }

}
