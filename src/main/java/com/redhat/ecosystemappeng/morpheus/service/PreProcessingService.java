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
import com.redhat.ecosystemappeng.morpheus.model.ReportData;

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

  public JsonNode parse(List<ReportData> payloads) throws IOException {
    LOGGER.info("Parsing payloads for pre-processing");

    InputStream is = getClass().getClassLoader().getResourceAsStream("preProcessingTemplate.json");
    if (is == null) {
        throw new IllegalArgumentException("Template file not found in resources.");
    }
    ObjectNode templateJson = (ObjectNode) objectMapper.readTree(is);

    templateJson.put("id", UUID.randomUUID().toString());

    ArrayNode dataArray = objectMapper.createArrayNode();

    for (ReportData payload : payloads) {
      String scanId = payload.reportRequestId().id();
      JsonNode sourceInfo = payload.report().at("/input/image/source_info");

      if (scanId != null && !scanId.isEmpty() && !sourceInfo.isMissingNode()) {
          ObjectNode dataEntry = objectMapper.createObjectNode();
          dataEntry.put("scan_id", scanId);
          dataEntry.set("source_info", sourceInfo);
          dataArray.add(dataEntry);
      }
    }

    templateJson.set("data", dataArray);

    LOGGER.info("Successfully parsed payloads");
    LOGGER.debug("Parsed payloads: " + templateJson.toPrettyString());
    return templateJson;
  }

  public JsonNode submit(JsonNode request) throws IOException {
    try {
      LOGGER.info("Sending payloads to Component Syncer for pre-processing: " + request.toPrettyString());
      Response response = componentSyncerService.submit(request);
      
      LOGGER.info("Successfully sent payloads to Component Syncer");
      LOGGER.debug("Component Syncer response status: " + response.getStatus());
      LOGGER.debug("Component Syncer response headers: " + response.getHeaders());
      LOGGER.debug("Component Syncer response body: " + response.readEntity(String.class));
      return objectMapper.createObjectNode().put("status", response.getStatus());
    } catch (Exception e) {
      LOGGER.error("Component Syncer failed", e);
      throw new IOException("Component Syncer failed", e);
    }
  }

}
