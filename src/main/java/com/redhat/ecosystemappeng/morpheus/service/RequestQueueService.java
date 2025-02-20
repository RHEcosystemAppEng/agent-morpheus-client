package com.redhat.ecosystemappeng.morpheus.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.Map;
import java.util.Queue;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.client.MorpheusService;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;

/**
 * This Service is not implemented to support a Clustered environment
 */
@ApplicationScoped
public class RequestQueueService {

  private static final Logger LOGGER = Logger.getLogger(RequestQueueService.class);

  @ConfigProperty(name = "morpheus.queue.max-active", defaultValue = "5")
  Integer maxActive;

  @ConfigProperty(name = "morpheus.queue.max-size", defaultValue = "100")
  Integer maxSize;

  @ConfigProperty(name = "morpheus.queue.timeout", defaultValue = "5m")
  Duration timeout;

  @RestClient
  MorpheusService morpheusService;

  @Inject
  ReportRepositoryService repository;

  @Inject
  ObjectMapper objectMapper;

  private Queue<String> pending = new LinkedList<>();
  private Map<String, LocalDateTime> active = new HashMap<>();
  private LocalDateTime lastCheck = LocalDateTime.now();

  @Scheduled(every = "10s")
  void checkQueue() {
    var expired = new HashSet<>();
    active.entrySet().forEach(e -> {
      if (lastCheck.isAfter(e.getValue().plus(timeout))) {
        expired.add(e.getKey());
        LOGGER.debugf("Expired report %s", e.getKey());
        repository.updateWithError(e.getKey(), "expired",
            String.format("timeout after %s seconds", timeout.toSeconds()));
      }
    });
    expired.forEach(active::remove);
    lastCheck = LocalDateTime.now();
    moveToActive();
  }

  private void moveToActive() {
    while (active.size() < maxActive) {
      var nextId = pending.poll();
      LOGGER.debugf("Polled %s from the pending queue", nextId);
      if (nextId == null) {
        return;
      }
      var report = repository.findById(nextId);
      if (report != null) {
        try {
          LOGGER.debugf("Submit report %s", nextId);
          submit(nextId, objectMapper.readTree(report));
        } catch (JsonProcessingException e) {
          LOGGER.error("Unable to submit request", e);
          repository.updateWithError(nextId, "json-processing-error", e.getMessage());
        }
      }
    }
  }

  public void queue(String id, JsonNode json) {
    if (active.size() >= maxActive) {
      if (pending.size() >= maxSize) {
        throw new RequestQueueExceededException(maxSize);
      }
      LOGGER.debugf("Added %s to pending queue", id);
      pending.add(id);
    } else {
      LOGGER.debugf("Submit report %s", id);
      submit(id, json);
    }
  }

  private void submit(String id, JsonNode report) {
    try {
      morpheusService.submit(report.get("input").toPrettyString());
      repository.setAsSent(id);
      active.put(id, LocalDateTime.now());
      LOGGER.debugf("Report %s sent to Morpheus", id);
    } catch (WebApplicationException e) {
      LOGGER.error("Unable to submit request", e);
      repository.updateWithError(id, "morpheus-request-error", e.getMessage());
    }
  }

  public void received(String id) {
    LOGGER.debugf("Received report %s. Removing from active queue.", id);
    active.remove(id);
  }

}
