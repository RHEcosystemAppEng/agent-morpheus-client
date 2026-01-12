package com.redhat.ecosystemappeng.morpheus.service;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import io.opentelemetry.context.Context;
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
import com.redhat.ecosystemappeng.morpheus.config.AppConfig;
import com.redhat.ecosystemappeng.morpheus.model.PaginatedResult;
import com.redhat.ecosystemappeng.morpheus.model.Pagination;
import com.redhat.ecosystemappeng.morpheus.model.Report;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.model.ReportReceivedEvent;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequest;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequestId;
import com.redhat.ecosystemappeng.morpheus.model.SortField;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.Image;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.ReportInput;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.Scan;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.SourceInfo;
import com.redhat.ecosystemappeng.morpheus.model.morpheus.VulnId;
import com.redhat.ecosystemappeng.morpheus.model.ProductReportsSummary;
import com.redhat.ecosystemappeng.morpheus.model.Product;
import com.redhat.ecosystemappeng.morpheus.model.ProductSummary;
import com.redhat.ecosystemappeng.morpheus.model.ReportsSummary;


import com.redhat.ecosystemappeng.morpheus.rest.NotificationSocket;

import io.quarkus.runtime.Startup;
import io.quarkus.scheduler.Scheduler;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;

import static com.redhat.ecosystemappeng.morpheus.tracing.TextMapPropagatorImpl.getTraceIdFromContext;

@ApplicationScoped
public class ReportService {

  private static final Logger LOGGER = Logger.getLogger(ReportService.class);
  private static final String PACKAGE_TYPE_PROPERTY = "syft:package:type";
  private static final Pattern PURL_PKG_TYPE = Pattern.compile("pkg\\:(\\w+)\\/.*");
  public static final String HOSTED_GITHUB_COM = "github.com";


  @RestClient
  GitHubService gitHubService;

  @Inject
  AppConfig appConfig;

  @Inject
  ReportRepositoryService repository;

  @Inject
  ProductService productService;

  @Inject
  RequestQueueService queueService;

  @ConfigProperty(name = "morpheus-ui.includes.path", defaultValue = "includes.json")
  String includesPath;

  @ConfigProperty(name = "morpheus-ui.excludes.path", defaultValue = "excludes.json")
  String excludesPath;

  @ConfigProperty(name = "morpheus-ui.ecosystem.default")
  Optional<String> defaultEcosystem;

  @Inject
  ObjectMapper objectMapper;

  @Inject
  NotificationSocket notificationSocket;

  @Inject
  UserService userService;

  @Inject
  Scheduler scheduler;

  private Map<String, Collection<String>> includes;
  private Map<String, Collection<String>> excludes;

  @ConfigProperty(name = "morpheus.purge.cron")
  Optional<String> purgeCron;

  @ConfigProperty(name = "morpheus.purge.after", defaultValue = "7d")
  Duration purgeAfter;

  @Startup
  void loadConfig() throws FileNotFoundException, IOException {
    includes = getMappingConfig(includesPath);
    excludes = getMappingConfig(excludesPath);
    if(purgeCron.isPresent()) {
      scheduler.newJob("purge_job").setCron(purgeCron.get()).setTask(executionContext -> {
        repository.removeBefore(Instant.now().minus(purgeAfter));
      }).schedule();
    }
  }

  private Map<String, Collection<String>> getMappingConfig(String path) throws IOException {
    try (var inputStream = this.getClass().getClassLoader().getResourceAsStream(path)) {
      if (inputStream != null) {
        return objectMapper.readValue(inputStream, new TypeReference<Map<String, Collection<String>>>() {});
      }
    }

    try (var fileInputStream = new FileInputStream(path)) {
      return objectMapper.readValue(fileInputStream, new TypeReference<Map<String, Collection<String>>>() {});
    }
  }

  public PaginatedResult<Report> list(Map<String, String> filter, List<SortField> sortBy, Integer page,
      Integer pageSize) {
    return repository.list(filter, sortBy, new Pagination(page, pageSize));
  }

  public List<ProductSummary> listProductSummaries() {
    List<ProductSummary> summaries = new ArrayList<>();
    List<String> productIds = repository.getProductIds();
    for (String productId : productIds) {
      summaries.add(getProductSummary(productId));
    }
    return summaries;
  }

  /**
   * Get summary of reports statistics
   * - Vulnerable reports: reports with at least one CVE with justification.status = "TRUE"
   * - Non-vulnerable reports: reports with only CVEs with justification.status = "FALSE" or no vulns
   * - Pending requests: reports with state = "pending"
   * - New reports today: reports submitted today (server timezone, calendar day)
   */
  public ReportsSummary getReportsSummary() {
    long vulnerableReportsCount = repository.countVulnerableReports();
    long nonVulnerableReportsCount = repository.countNonVulnerableReports();
    long pendingRequestsCount = repository.countPendingRequests();
    long newReportsTodayCount = repository.countNewReportsToday();
    
    return new ReportsSummary(
        vulnerableReportsCount,
        nonVulnerableReportsCount,
        pendingRequestsCount,
        newReportsTodayCount
    );
  }

  public ProductSummary getProductSummary(String productId) {
    Product product = productService.get(productId);

    ProductReportsSummary productReportsSummary = repository.getProductSummaryData(productId);
    
    return new ProductSummary(
      product, 
      productReportsSummary
    );
  }

  public List<String> getReportIds(List<String> productIds) {
    if (Objects.isNull(productIds) || productIds.isEmpty()) {
      return new ArrayList<>();
    }
    return repository.getReportIdsByProduct(productIds);
  }

  public String get(String id) {
    LOGGER.debugf("Get report %s", id);
    return repository.findById(id);
  }

  public boolean remove(String id) {
    LOGGER.debugf("Remove report %s", id);
    queueService.deleted(id);
    return repository.remove(id);
  }

  public boolean remove(Collection<String> ids) {
    LOGGER.debugf("Remove reports %s", ids.toString());
    queueService.deleted(ids);
    return repository.remove(ids);
  }
  
  public Collection<String> remove(Map<String, String> query) {
    LOGGER.debugf("Remove reports with filter: %s", query);
    Collection<String> deleteIds = repository.remove(query);
    queueService.deleted(deleteIds);
    return deleteIds;
  }

  public boolean retry(String id) throws JsonProcessingException {
    var report = get(id);
    if(Objects.isNull(report)) {
      return false;
    }
    repository.setAsRetried(id, userService.getUserName());
    LOGGER.debugf("Retry report %s", id);
    queueService.queue(id, objectMapper.readTree(report));

    return true;
  }

  public ReportRequestId receive(String report) {
    String scanId = null;
    String id = null;
    try {
      var reportJson = objectMapper.readTree(report);
      var scan = reportJson.get("input").get("scan");
      scanId = getProperty(scan, "id");

      List<String> existing = null;
      if (Objects.nonNull(scanId)) {
        existing = repository.findByName(scanId).stream().map(Report::id).toList();
        if(existing.size() == 1) {
          id = existing.get(0);
        }
      } else {
        scanId = getTraceIdFromContext(Context.current());
      }

      if (Objects.isNull(existing) || existing.isEmpty()) {
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
        queueService.received(existingId);
      }
    } catch (Exception e) {
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

  public ReportData process(ReportRequest request) throws JsonProcessingException, IOException {
    LOGGER.info("Processing request for Agent Morpheus");

    var scan = buildScan(request);
    var image = buildImage(request);
    var input = new ReportInput(scan, image);

    var report = objectMapper.createObjectNode();
    report.set("input", objectMapper.convertValue(input, JsonNode.class));
    report.set("metadata", objectMapper.convertValue(request.metadata(), JsonNode.class));
    var created = repository.save(report.toPrettyString());
    var reportRequestId = new ReportRequestId(created.id(), scan.id());
    LOGGER.infof("Successfully processed request ID: %s", created.id());
    LOGGER.debug("Agent Morpheus payload: " + report.toPrettyString());
    return new ReportData(reportRequestId, report);
  }

  /**
   * Creates a pending report for a component with minimal data.
   * The report will have status "pending" and can be updated later with full SBOM data.
   * 
   * @param component The component information
   * @param productId The product ID this component belongs to
   * @param metadata Additional metadata to include
   * @param vulnerabilityId Optional vulnerability ID to include in scan.vulns
   * @return ReportData containing the report ID and report JSON
   */
  public ReportData createPendingReport(SpdxParsingService.ComponentInfo component, String productId, 
                                        Map<String, String> metadata, String vulnerabilityId) 
      throws JsonProcessingException {
    LOGGER.debugf("Creating pending report for component: %s", component.name());

    // Build scan ID from component
    String scanId = String.format("%s-scan", component.spdxId());
    
    // Build vulnerability list
    List<VulnId> vulns = new ArrayList<>();
    if (vulnerabilityId != null && !vulnerabilityId.trim().isEmpty()) {
      vulns.add(new VulnId(vulnerabilityId.toUpperCase()));
    }
    
    // Create minimal scan (no started_at/completed_at)
    Scan scan = new Scan(scanId, vulns);
    
    // Create minimal image (no sourceInfo, no sbomInfo)
    Image image = new Image(
        "image", // analysisType
        null, // ecosystem
        null, // manifestPath
        component.name(), // name
        component.version() != null ? component.version() : "", // tag
        Collections.emptyList(), // sourceInfo
        null // sbomInfo
    );
    
    var input = new ReportInput(scan, image);
    
    // Build metadata
    Map<String, String> reportMetadata = new HashMap<>();
    if (metadata != null) {
      reportMetadata.putAll(metadata);
    }
    reportMetadata.put("product_id", productId);
    reportMetadata.put("component_spdx_id", component.spdxId());
    reportMetadata.put("component_name", component.name());
    if (component.version() != null) {
      reportMetadata.put("component_version", component.version());
    }
    if (component.purl() != null) {
      reportMetadata.put("component_purl", component.purl());
    }
    
    var report = objectMapper.createObjectNode();
    report.set("input", objectMapper.convertValue(input, JsonNode.class));
    report.set("metadata", objectMapper.convertValue(reportMetadata, JsonNode.class));
    
    var created = repository.save(report.toPrettyString());
    var reportRequestId = new ReportRequestId(created.id(), scanId);
    LOGGER.infof("Created pending report ID: %s for component: %s", created.id(), component.name());
    return new ReportData(reportRequestId, report);
  }

  /**
   * Updates an existing pending report with full SBOM data and image information.
   * Only works for reports in "pending" state. Throws error if report is not pending.
   * 
   * @param reportId The ID of the report to update
   * @param cycloneDxSbom The CycloneDX SBOM JSON
   * @param component The component information
   * @return Updated report JSON
   * @throws IllegalArgumentException if report is not in pending state or scan is missing
   */
  public JsonNode updateReportWithSbom(String reportId, JsonNode cycloneDxSbom, 
                                      SpdxParsingService.ComponentInfo component) 
      throws JsonProcessingException, IOException {
    LOGGER.debugf("Updating report %s with SBOM for component: %s", reportId, component.name());
    
    // Get existing report
    String existingReportJson = repository.findById(reportId);
    if (existingReportJson == null) {
      throw new NotFoundException("Report not found: " + reportId);
    }
    
    JsonNode existingReport = objectMapper.readTree(existingReportJson);
    
    // Verify report is in pending state
    if (!isPending(existingReport)) {
      throw new IllegalArgumentException("Report " + reportId + " is not in pending state and cannot be updated");
    }
    
    // Get existing input and scan - must exist
    JsonNode existingInput = existingReport.get("input");
    if (existingInput == null) {
      throw new IllegalArgumentException("Report " + reportId + " is missing input field");
    }
    
    JsonNode existingScan = existingInput.get("scan");
    if (existingScan == null) {
      throw new IllegalArgumentException("Report " + reportId + " is missing scan object");
    }
    
    // Preserve existing scan ID and vulnerabilities
    String scanId = existingScan.has("id") ? existingScan.get("id").asText() : null;
    if (scanId == null || scanId.isEmpty()) {
      throw new IllegalArgumentException("Report " + reportId + " scan is missing id");
    }
    
    List<VulnId> existingVulns = new ArrayList<>();
    if (existingScan.has("vulns") && existingScan.get("vulns").isArray()) {
      for (JsonNode vulnNode : existingScan.get("vulns")) {
        if (vulnNode.has("vuln_id")) {
          existingVulns.add(new VulnId(vulnNode.get("vuln_id").asText()));
        }
      }
    }
    
    // Build scan with existing ID and vulnerabilities
    Scan scan = new Scan(scanId, existingVulns);
    
    // Build full image with SBOM data
    Image image = buildImageFromCycloneDx(cycloneDxSbom, component);
    
    // Create new input with updated scan and image
    var input = new ReportInput(scan, image);
    
    // Update only the input in repository (metadata is preserved automatically)
    repository.updateReportInput(reportId, objectMapper.convertValue(input, JsonNode.class));
    
    // Return updated report structure for caller
    var report = objectMapper.createObjectNode();
    report.set("input", objectMapper.convertValue(input, JsonNode.class));
    report.set("metadata", existingReport.get("metadata"));
    
    LOGGER.debugf("Updated report %s with SBOM data", reportId);
    return report;
  }

  /**
   * Checks if a report is in "pending" state.
   * A report is pending if:
   * - It has no error
   * - It has no completed_at in scan
   * - It has no sent_at in metadata
   * - It has no submitted_at in metadata
   * - It has product_id in metadata
   */
  private boolean isPending(JsonNode report) {
    // Check for error
    if (report.has("error") && !report.get("error").isNull()) {
      return false;
    }
    
    // Check for completed_at in scan
    JsonNode input = report.get("input");
    if (input != null) {
      JsonNode scan = input.get("scan");
      if (scan != null && scan.has("completed_at") && !scan.get("completed_at").isNull()) {
        return false;
      }
    }
    
    // Check metadata
    JsonNode metadata = report.get("metadata");
    if (metadata == null) {
      return false;
    }
    
    // Must have product_id to be pending
    if (!metadata.has("product_id") || metadata.get("product_id").isNull()) {
      return false;
    }
    
    // Must not have sent_at
    if (metadata.has("sent_at") && !metadata.get("sent_at").isNull()) {
      return false;
    }
    
    // Must not have submitted_at
    if (metadata.has("submitted_at") && !metadata.get("submitted_at").isNull()) {
      return false;
    }
    
    return true;
  }

  /**
   * Builds an Image object from CycloneDX SBOM and component info.
   */
  private Image buildImageFromCycloneDx(JsonNode cycloneDxSbom, SpdxParsingService.ComponentInfo component) 
      throws JsonProcessingException, IOException {
    String name = component.name();
    String tag = component.version() != null ? component.version() : "";
    
    // Extract source info from SBOM metadata if available
    List<SourceInfo> sourceInfo = Collections.emptyList();
    if (cycloneDxSbom.has("metadata")) {
      JsonNode metadata = cycloneDxSbom.get("metadata");
      if (metadata.has("properties")) {
        Map<String, String> properties = new HashMap<>();
        metadata.get("properties").forEach(p -> {
          if (p.has("name") && p.has("value")) {
            properties.put(p.get("name").asText(), p.get("value").asText());
          }
        });
        
        String sourceLocation = getSourceLocationFromMetadataLabels(properties);
        String commitId = getCommitIdFromMetadataLabels(new HashMap<>(properties));
        
        Set<String> languages = buildLanguagesExtensions(null);
        var allIncludes = languages.stream().map(includes::get).filter(Objects::nonNull).flatMap(Collection::stream)
            .toList();
        var allExcludes = languages.stream().map(excludes::get).filter(Objects::nonNull).flatMap(Collection::stream)
            .toList();
        
        sourceInfo = List.of(
            new SourceInfo("code", sourceLocation, commitId, allIncludes, allExcludes),
            new SourceInfo("doc", sourceLocation, commitId, includes.get("Docs"), Collections.emptyList()));
      }
    }
    
    // Build sbomInfo
    ObjectNode sbomInfo = objectMapper.createObjectNode();
    sbomInfo.put("_type", "cyclonedx+json");
    sbomInfo.set("packages", buildManualSbom(cycloneDxSbom));
    
    return new Image("image", null, null, name, tag, sourceInfo, sbomInfo);
  }

  public void submit(String id, JsonNode report) throws JsonProcessingException, IOException {
    String byUser = determineUser(report);
    repository.setAsSubmitted(id, byUser);
    queueService.queue(id, report);
    LOGGER.infof("Request ID: %s, sent to Agent Morpheus for analysis", id);
  }

  private String determineUser(JsonNode report) {
    JsonNode metadata = report.get("metadata");
    if (metadata != null && metadata.has("product_id")) {
      String productId = metadata.get("product_id").asText();
      String productUser = productService.getUserName(productId);
      if (productUser != null && !productUser.isEmpty()) {
        return productUser;
      }
    }
    
    return userService.getUserName();
  }

  private Scan buildScan(ReportRequest request) {
    var id = request.id();
    if (Objects.isNull(id)) {
      id = getTraceIdFromContext(Context.current());
    }
    return new Scan(id, request.vulnerabilities().stream().map(String::toUpperCase).map(VulnId::new).toList());
  }

  private Image buildImage(ReportRequest request) throws JsonProcessingException, IOException {

    String sourceLocation = null;
    String commitId = null;
    String name = null;
    String tag = null;
    JsonNode sbomInfo = null;

    String ecosystem = request.ecosystem();
    if (Objects.isNull(ecosystem) || ecosystem.trim().isEmpty()) {
      ecosystem = defaultEcosystem.orElse("");
    }

    String manifestPath = request.manifestPath();
    if (Objects.isNull(manifestPath)) {
      manifestPath = "";
    }

    if ("image".equals(request.analysisType())) {
      if (Objects.nonNull(request.image())){
        return objectMapper.treeToValue(request.image(), Image.class);
      }
      var sbom = request.sbom();
      var metadata = sbom.get("metadata");
      var component = metadata.get("component");
      name = getProperty(component, "name");
      tag = getProperty(component, "version");
      var properties = new HashMap<String, String>();
      metadata.get("properties").forEach(p -> properties.put(getProperty(p, "name"), getProperty(p, "value")));
      if(Objects.nonNull(request.metadata())) {
        properties.putAll(request.metadata());
      }
      commitId = getCommitIdFromMetadataLabels(properties);
      sourceLocation = getSourceLocationFromMetadataLabels(properties);
      sbomInfo = buildSbomInfo(request);
    } else {
      name = request.sourceRepo();
      tag = request.commitId();
      sourceLocation = request.sourceRepo();
      commitId = request.commitId();
    }
    Set<String> languages;
    if (sourceLocation.contains(HOSTED_GITHUB_COM)) {
      languages = getGitHubLanguages(sourceLocation);
    }
    else {
      languages = buildLanguagesExtensions(request.ecosystem());
    }

    var allIncludes = languages.stream().map(includes::get).filter(Objects::nonNull).flatMap(Collection::stream)
        .toList();
    var allExcludes = languages.stream().map(excludes::get).filter(Objects::nonNull).flatMap(Collection::stream)
        .toList();
    var srcInfo = List.of(
        new SourceInfo("code", sourceLocation, commitId, allIncludes, allExcludes),
        new SourceInfo("doc", sourceLocation, commitId, includes.get("Docs"), Collections.emptyList()));

    return new Image(request.analysisType(), ecosystem, manifestPath, name, tag, srcInfo, sbomInfo);
  }

  private Set<String> buildLanguagesExtensions(String ecosystem) {
    if(Objects.nonNull(ecosystem) && !ecosystem.trim().isEmpty()) {
      String programmingLanguage = includes.keySet().stream().filter(eco -> eco.trim().equalsIgnoreCase(ecosystem)).findFirst().get();
      return Set.of(programmingLanguage);
    }
    else {
      return includes.keySet().stream().collect(Collectors.toSet());
      }
    }

  private String getSourceLocationFromMetadataLabels(Map<String, String> properties) {
    return appConfig.image().source().locationKeys().stream()
        .map(String::trim)
        .map(properties::get)
        .filter(Objects::nonNull)
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException(
            "SBOM is missing required field. Checked keys: " + appConfig.image().source().locationKeys()));
  }


  private String getCommitIdFromMetadataLabels(HashMap<String, String> properties) {
    return appConfig.image().source().commitIdKeys().stream()
        .map(String::trim)
        .map(properties::get)
        .filter(Objects::nonNull)
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException(
            "SBOM is missing required field. Checked keys: " + appConfig.image().source().commitIdKeys()));
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
    var components = sbom.get("components");
    if (Objects.isNull(components)) {
      throw new IllegalArgumentException("SBOM is missing required field: components");
    }
    components.forEach(c -> {
      var pkg = objectMapper.createObjectNode();
      pkg.put("name", getProperty(c, "name"));
      pkg.put("version", getProperty(c, "version"));
      var purl = getProperty(c, "purl");
      pkg.put("purl", purl);
      var system = getComponentProperty(c.withArray("properties"));
      if (Objects.isNull(system) && Objects.nonNull(purl)) {
        var matcher = PURL_PKG_TYPE.matcher(purl);
        if(matcher.matches()) {
          system = matcher.group(1);
        }
      }
      if (Objects.nonNull(system)) {
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
    if (Objects.isNull(properties)) {
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
