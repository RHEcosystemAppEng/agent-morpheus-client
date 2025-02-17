package com.redhat.ecosystemappeng.morpheus.service;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.redhat.ecosystemappeng.morpheus.client.GitHubService;
import com.redhat.ecosystemappeng.morpheus.client.MorpheusService;
import com.redhat.ecosystemappeng.morpheus.model.PaginatedResult;
import com.redhat.ecosystemappeng.morpheus.model.Pagination;
import com.redhat.ecosystemappeng.morpheus.model.Report;
import com.redhat.ecosystemappeng.morpheus.model.ReportReceivedEvent;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequest;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequestId;
import com.redhat.ecosystemappeng.morpheus.model.SortField;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.Image;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.ReportInput;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.Scan;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.SourceInfo;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.VulnId;
import com.redhat.ecosystemappeng.morpheus.rest.NotificationSocket;

import io.quarkus.oidc.UserInfo;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;

@ApplicationScoped
public class ReportService {

  private static final Logger LOGGER = Logger.getLogger(ReportService.class);

  private static final String COMMIT_ID_PROPERTY = "syft:image:labels:io.openshift.build.commit.id";
  private static final String SOURCE_LOCATION_PROPERTY = "syft:image:labels:io.openshift.build.source-location";
  private static final String PACKAGE_TYPE_PROPERTY = "syft:package:type";
  private static final Pattern PURL_PKG_TYPE = Pattern.compile("pkg\\:(\\w+)\\/.*");

  @RestClient
  GitHubService gitHubService;

  @Inject
  ReportRepositoryService repository;

  @RestClient
  MorpheusService morpheusService;

  @ConfigProperty(name = "morpheus-ui.includes.path", defaultValue = "includes.json")
  String includesPath;

  @ConfigProperty(name = "morpheus-ui.excludes.path", defaultValue = "excludes.json")
  String excludesPath;

  @Inject
  ObjectMapper objectMapper;

  @Inject
  NotificationSocket notificationSocket;

  @Inject
  UserInfo userInfo;

  private Map<String, Collection<String>> includes;
  private Map<String, Collection<String>> excludes;

  @PostConstruct
  void loadConfig() throws FileNotFoundException, IOException {
    includes = getMappingConfig(includesPath);
    excludes = getMappingConfig(excludesPath);
  }

  private Map<String, Collection<String>> getMappingConfig(String path) throws IOException {
    var inputStream = this.getClass().getClassLoader().getResourceAsStream(path);
    if (inputStream == null) {
      inputStream = new FileInputStream(path);
    }
    return objectMapper.readValue(inputStream, new TypeReference<Map<String, Collection<String>>>() {
    });
  }

  public PaginatedResult<Report> list(Map<String, String> filter, List<SortField> sortBy, Integer page,
      Integer pageSize) {
    return repository.list(filter, sortBy, new Pagination(page, pageSize));
  }

  public String get(String id) {
    return repository.findById(id);
  }

  public boolean remove(String id) {
    return repository.remove(id);
  }

  public ReportRequestId save(String report) {
    String scanId = null;
    String id = null;
    try {
      var reportJson = objectMapper.readTree(report);
      var scan = reportJson.get("input").get("scan");
      scanId = getProperty(scan, "id");

      List<String> existing = null;
      if (scanId != null) {
        existing = repository.findByName(scanId).stream().map(Report::id).toList();
        if(existing.size() == 1) {
          id = existing.get(0);
        }
      } else {
        scanId = UUID.randomUUID().toString();
      }

      if (existing == null || existing.isEmpty()) {
        LOGGER.infof("Complete new report %s", scanId);

        var created = repository.save(report);
        existing = List.of(created.id());
        id = created.id();
      } else {
        LOGGER.infof("Complete existing report %s", scanId);
        repository.updateWithOutput(existing, reportJson);
      }

      for (String existingId : existing) {
        var event = new ReportReceivedEvent(existingId, scanId, "Completed");
        notificationSocket.onMessage(objectMapper.writeValueAsString(event));
      }
    } catch (IOException e) {
      LOGGER.warn("Unable to process received report", e);
      var event = new ReportReceivedEvent(null, scanId, e.getMessage());
      try {
        notificationSocket.onMessage(objectMapper.writeValueAsString(event));
      } catch (JsonProcessingException e1) {
        LOGGER.warn("Unable to emit error event", e);
      }
    }
    return new ReportRequestId(id, scanId);
  }

  public ReportRequestId submit(ReportRequest request) throws JsonProcessingException, IOException {
    var id = request.id();
    if (id == null) {
      id = UUID.randomUUID().toString();
    }
    var scan = buildScan(request);
    var image = buildImage(request);
    var input = new ReportInput(scan, image);

    var report = objectMapper.createObjectNode();
    report.set("input", objectMapper.convertValue(input, JsonNode.class));
    var metadata = objectMapper.createObjectNode().put("user", getUser());
    if (request.metadata() != null) {
      request.metadata().entrySet().forEach(e -> metadata.put(e.getKey(), e.getValue()));
    }
    report.set("metadata", metadata);

    try {
      morpheusService.submit(objectMapper.writeValueAsString(input));
      var created = repository.save(report.toPrettyString());
      return new ReportRequestId(created.id(), scan.id());
    } catch (JsonProcessingException e) {
      ObjectNode obj = (ObjectNode) report.get("input").get("scan");
      obj.set("error", objectMapper.createObjectNode().put("type", "ProcessingError").put("message", e.getMessage()));
      var created = repository.save(report.toPrettyString());
      return new ReportRequestId(created.id(), scan.id());
    }
  }

  private String getUser() {
    var defaultName = "anonymous";
    if(userInfo != null) {
      var metadata = userInfo.getObject("metadata");
      if(metadata != null) {
        var name = metadata.getString("name");
        if(name != null) {
          return name;
        }
      }
    } 
    return defaultName;
  }

  private Scan buildScan(ReportRequest request) {
    var id = request.id();
    if (id == null) {
      id = UUID.randomUUID().toString();
    }
    return new Scan(id, request.vulnerabilities().stream().map(String::toUpperCase).map(VulnId::new).toList());
  }

  private Image buildImage(ReportRequest request) {
    var sbom = request.sbom();
    var metadata = sbom.get("metadata");
    var component = metadata.get("component");
    var name = getProperty(component, "name");
    var tag = getProperty(component, "version");
    var properties = new HashMap<String, String>();
    metadata.get("properties").forEach(p -> properties.put(getProperty(p, "name"), getProperty(p, "value")));

    var commitId = properties.get(COMMIT_ID_PROPERTY);
    var sourceLocation = properties.get(SOURCE_LOCATION_PROPERTY);

    var languages = getGitHubLanguages(sourceLocation);
    var allIncludes = languages.stream().map(includes::get).filter(Objects::nonNull).flatMap(Collection::stream)
        .toList();
    var allExcludes = languages.stream().map(excludes::get).filter(Objects::nonNull).flatMap(Collection::stream)
        .toList();
    var srcInfo = List.of(
        new SourceInfo("git", "code", sourceLocation, commitId, allIncludes, allExcludes),
        new SourceInfo("git", "doc", sourceLocation, commitId, includes.get("Docs"), Collections.emptyList()));
    var sbomInfo = buildSbomInfo(request);
    return new Image(name, tag, srcInfo, sbomInfo);
  }

  private JsonNode buildSbomInfo(ReportRequest request) {
    var sbomInfo = objectMapper.createObjectNode();
    sbomInfo.put("_type", request.sbomInfoType().toString());
    switch (request.sbomInfoType()) {
      case CYCLONEDX_JSON:
        throw new IllegalArgumentException("The Agent Morpheus Backend does not yet support cyclonedx+json");
      case MANUAL:
        sbomInfo.set("packages", buildManualSbom(request.sbom()));
        break;
      default:
        throw new IllegalArgumentException("The sbom_info_type must be manual");
    }
    return sbomInfo;
  }

  public JsonNode buildManualSbom(JsonNode sbom) {
    ArrayNode packages = objectMapper.createArrayNode();
    sbom.get("components").forEach(c -> {
      var pkg = objectMapper.createObjectNode();
      pkg.put("name", getProperty(c, "name"));
      pkg.put("version", getProperty(c, "version"));
      var purl = getProperty(c, "purl");
      pkg.put("purl", purl);
      var system = getComponentProperty(c.withArray("properties"));
      if (system == null && purl != null) {
        var matcher = PURL_PKG_TYPE.matcher(purl);
        if(matcher.matches()) {
          system = matcher.group(1);
        }
      }
      if (system != null) {
        pkg.put("system", system);
        packages.add(pkg);
      }
    });
    return packages;
  }

  private String getProperty(JsonNode node, String property) {
    if (node.hasNonNull(property)) {
      return node.get(property).asText();
    }
    return null;
  }

  private String getComponentProperty(ArrayNode properties) {
    if (properties == null) {
      return null;
    }
    var it = properties.iterator();
    while (it.hasNext()) {
      var p = it.next();
      if (PACKAGE_TYPE_PROPERTY.equalsIgnoreCase(getProperty(p, "name"))) {
        var value = getProperty(p, "value");
        switch (value) {
          case null:
            return null;
          case "go-module":
            return "golang";
          case "java-archive":
            return "maven";
          default:
            return value;
        }
      }
    }
    return null;
  }

  private Set<String> getGitHubLanguages(String repository) {
    var repoName = repository.replace("https://github.com/", "");
    try {
      LOGGER.debugf("looking for programming languages for repository %s", repoName);
      return gitHubService.getLanguages(repoName).keySet();
    } catch (NotFoundException e) {
      LOGGER.infof(e, "Unable to retrieve languages for repository %s", repoName);
      return Collections.emptySet();
    } catch (Exception e) {
      LOGGER.error("Unable to retrieve programming languages", e);
      throw e;
    }
  }

}
