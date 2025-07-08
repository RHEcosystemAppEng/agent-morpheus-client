package com.redhat.ecosystemappeng.morpheus.service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.redhat.ecosystemappeng.morpheus.client.ComponentSyncerService;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;

import io.quarkus.scheduler.Scheduled;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.Response;

@ApplicationScoped
public class PreProcessingService {

  private static final Logger LOGGER = Logger.getLogger(PreProcessingService.class);
  private final Map<String, LocalDateTime> submitted = new ConcurrentHashMap<>();
  
  @ConfigProperty(name = "morpheus.syncer.timeout", defaultValue = "5m")
  Duration timeout;
  
  @Inject
  ObjectMapper objectMapper;

  @RestClient
  ComponentSyncerService componentSyncerService;

  @Inject
  ReportRepositoryService repository;

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

  public Response submit(JsonNode request, List<String> ids) throws IOException, InterruptedException {
    final int maxRetries = 3;
    final long initialDelayMillis = 5000;

    int attempt = 0;
    long delay = initialDelayMillis;

    while (true) {
      attempt++;
      LOGGER.infof("Attempt {%d}: Sending payloads to Component Syncer for pre-processing: %s", attempt, request.toPrettyString());
      Response response = componentSyncerService.submit(request);

      int status = response.getStatus();
      LOGGER.debug("Component Syncer response status: " + status);

      if (status >= 200 && status < 300) {
          LOGGER.info("Successfully sent payloads to Component Syncer");
          LOGGER.debug("Component Syncer response headers: " + response.getHeaders());
          LOGGER.debug("Component Syncer response body: " + response.readEntity(String.class));
          
          LocalDateTime now = LocalDateTime.now();
          ids.forEach(id -> submitted.put(id, now));

          return response;
      } else if (status >= 500 && attempt < maxRetries) {
          LOGGER.warnf("Component Syncer failed with status code: %s, will retry in %dms", status, delay);
          Thread.sleep(delay);
          delay = delay * 2;
      } else {
          LOGGER.errorf("Component Syncer failed with status code: %s, all retries exhausted", status);
          return response;
      }
    }
  }

  public List<String> getIds(List<ReportData> payloads) {
    return payloads.stream().map(payload -> payload.reportRequestId().id()).collect(Collectors.toList());
  }

  public void handleError(String id, String errorType, String errorMessage) {
    LOGGER.warnf("Component Syncer failed with error type %s for component ID %s", errorType, id);
    repository.updateWithError(id, errorType, errorMessage);
  }

  @Scheduled(every = "10s")
  public void checkSubmitted() {
    LocalDateTime now = LocalDateTime.now();
    Set<String> expired = new HashSet<>();

    submitted.forEach((id, startTime) -> {
        if (now.isAfter(startTime.plus(timeout))) {
            expired.add(id);
            LOGGER.warnf("Component Syncer timeout for component Id: %s", id);
            handleError(id,"component-syncer-timeout-error",String.format("No response from Component Syncer after %s seconds", timeout.toSeconds())
            );
        }
    });

    expired.forEach(submitted::remove);
  }

  public void confirmResponse(String id) {
    submitted.remove(id);
  }
}
