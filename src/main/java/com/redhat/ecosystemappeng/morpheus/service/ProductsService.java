package com.redhat.ecosystemappeng.morpheus.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.bson.Document;
import org.bson.conversions.Bson;
import org.bson.types.ObjectId;
import org.jboss.logging.Logger;

import com.mongodb.client.model.Accumulators;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.redhat.ecosystemappeng.morpheus.model.Product;
import com.redhat.ecosystemappeng.morpheus.model.PaginatedResult;
import com.redhat.ecosystemappeng.morpheus.model.Pagination;
import com.redhat.ecosystemappeng.morpheus.model.SortType;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ProductsService {

  private static final Logger LOGGER = Logger.getLogger(ProductsService.class);
  private static final String PRODUCT_ID = "product_id";
  private static final String SBOM_NAME = "sbom_name";
  private static final String SENT_AT = "sent_at";
  private static final String SUBMITTED_AT = "submitted_at";

  // Reuse STATUS_FILTERS logic from ReportRepositoryService
  private static final Map<String, Bson> STATUS_FILTERS = Map.of(
      "completed", Filters.ne("input.scan.completed_at", null),
      "sent",
      Filters.and(Filters.ne("metadata." + SENT_AT, null), Filters.eq("error", null),
          Filters.eq("input.scan.completed_at", null)),
      "failed", Filters.ne("error", null),
      "queued", Filters.and(Filters.ne("metadata." + SUBMITTED_AT, null), Filters.eq("metadata." + SENT_AT, null),
          Filters.eq("error", null), Filters.eq("input.scan.completed_at", null)),
      "expired", Filters.and(Filters.ne("error", null), Filters.eq("error.type", "expired")),
      "pending", Filters.and(
          Filters.eq("metadata." + SENT_AT, null),
          Filters.eq("metadata." + SUBMITTED_AT, null),
          Filters.ne("metadata." + PRODUCT_ID, null)));

  @Inject
  ReportRepositoryService reportRepositoryService;

  public PaginatedResult<Product> getProducts(String sortField, SortType sortType, Pagination pagination,
      String sbomName, String cveId, String exploitIqStatus, String analysisState) {
    List<Product> products = new ArrayList<>();
    
    List<Bson> filterConditions = new ArrayList<>();
    filterConditions.add(Filters.exists("metadata." + PRODUCT_ID, true));
    
    List<Bson> filterOptions = new ArrayList<>();
    
    if (sbomName != null && !sbomName.trim().isEmpty()) {
      // Escape special regex characters to prevent regex injection and allow literal text search.
      // The pattern matches special regex characters: \ + * ? [ ] ( ) { } ^ $ | .
      // Each matched character is escaped with a backslash (e.g., "test-product" -> "test\-product")
      // This allows users to search for literal text containing special characters while still
      // supporting partial matching (e.g., searching "test" matches "test-product" and "my-test-sbom")
      String escaped = sbomName.trim().replaceAll("([\\\\+*?\\[\\](){}^$|.])", "\\\\$1");
      filterOptions.add(Filters.regex("metadata." + SBOM_NAME, 
          Pattern.compile(escaped, Pattern.CASE_INSENSITIVE)));
    }
    
    if (cveId != null && !cveId.trim().isEmpty()) {
      String escaped = cveId.trim().replaceAll("([\\\\+*?\\[\\](){}^$|.])", "\\\\$1");
      filterOptions.add(Filters.elemMatch("input.scan.vulns", 
          Filters.regex("vuln_id", Pattern.compile(escaped, Pattern.CASE_INSENSITIVE))));
    }
    
    // TODO: ExploitIQ Status filter - NOT YET IMPLEMENTED
    
    if (analysisState != null && !analysisState.trim().isEmpty()) {
      String[] stateValues = analysisState.split(",");
      List<Bson> stateFilters = new ArrayList<>();
      for (String stateValue : stateValues) {
        Bson stateFilter = STATUS_FILTERS.get(stateValue.trim());
        if (stateFilter != null) {
          stateFilters.add(stateFilter);
        }
      }
      if (!stateFilters.isEmpty()) {
        filterOptions.add(stateFilters.size() == 1 
            ? stateFilters.get(0) 
            : Filters.or(stateFilters));
      }
    }
    
    // Combine all filters: all filter options with AND logic, Multiple values within the same filter type use OR logic
    if (!filterOptions.isEmpty()) {
      filterConditions.add(filterOptions.size() == 1 
          ? filterOptions.get(0) 
          : Filters.and(filterOptions));
    }
    
    Bson filter = filterConditions.size() == 1 
        ? filterConditions.get(0) 
        : Filters.and(filterConditions);
    
    // Build sort
    String sortFieldPath = getSortFieldPath(sortField);
    Bson sort = sortType == SortType.ASC 
        ? Sorts.ascending(sortFieldPath)
        : Sorts.descending(sortFieldPath);
    
    // Build aggregation pipeline
    List<Bson> pipeline = new ArrayList<>();
    pipeline.add(Aggregates.match(filter));
    pipeline.add(Aggregates.sort(sort));
    pipeline.add(Aggregates.group(
        "$metadata." + PRODUCT_ID,
        Accumulators.push("reports", "$$ROOT")
    ));
    pipeline.add(Aggregates.skip(pagination.page() * pagination.size()));
    pipeline.add(Aggregates.limit(pagination.size()));
    
    // Execute aggregation
    reportRepositoryService.getCollection()
        .aggregate(pipeline)
        .forEach(groupDoc -> {
          Product product = processGroup(groupDoc);
          if (product != null) {
            products.add(product);
          }
        });
    
    // Get total count of groups for pagination
    long totalGroups = getTotalGroupCount(filter);
    int totalPages = (int) Math.ceil((double) totalGroups / pagination.size());
    
    return new PaginatedResult<>(totalGroups, totalPages, products.stream());
  }

  public Product getProductById(String productId) {
    // Build filter for reports with specific product_id
    LOGGER.infof("Getting product by ID: %s", productId);
    Bson filter = Filters.eq("metadata." + PRODUCT_ID, productId);
    
    // Collect all reports for this product_id
    List<Document> reports = new ArrayList<>();
    reportRepositoryService.getCollection()
        .find(filter)
        .forEach(reports::add);
    
    // If no reports found, return null
    if (reports.isEmpty()) {
      return null;
    }
    
    // Process reports directly (no need for aggregation since all have same product_id)
    return processReports(productId, reports);
  }

  private String getSortFieldPath(String sortField) {
    return switch (sortField) {
      case "completedAt" -> "input.scan.completed_at";
      case "sbomName" -> "metadata." + SBOM_NAME;
      default -> "input.scan.completed_at";
    };
  }

  private long getTotalGroupCount(Bson filter) {
    List<Bson> countPipeline = new ArrayList<>();
    countPipeline.add(Aggregates.match(filter));
    countPipeline.add(Aggregates.group("$metadata." + PRODUCT_ID));
    
    long count = 0;
    for (@SuppressWarnings("unused") Document doc : reportRepositoryService.getCollection().aggregate(countPipeline)) {
      count++;
    }
    return count;
  }

  private Product processGroup(Document groupDoc) {
    try {
      String productId = groupDoc.getString("_id");
      if (productId == null || productId.isEmpty()) {
        return null;
      }
      
      @SuppressWarnings("unchecked")
      List<Document> reports = groupDoc.getList("reports", Document.class);
      if (reports == null || reports.isEmpty()) {
        return null;
      }
      
      return processReports(productId, reports);
    } catch (Exception e) {
      LOGGER.errorf("Error processing group: %s", e.getMessage(), e);
      return null;
    }
  }

  private Product processReports(String productId, List<Document> reports) {
    try {
      if (reports == null || reports.isEmpty()) {
        return null;
      }
      
      Document firstReport = reports.get(0);
      
      // Extract firstReportId from first report
      String firstReportId = extractReportId(firstReport);
      
      // Extract sbomName from first report
      String sbomName = extractSbomName(firstReport);
      
      // Extract cveId from first report
      String cveId = extractCveId(firstReport);
      
      // Build cveStatusCounts
      Map<String, Integer> cveStatusCounts = buildCveStatusCounts(reports);
      
      // Build statusCounts
      Map<String, Integer> statusCounts = buildStatusCounts(reports);
      
      // Calculate completedAt
      String completedAt = calculateCompletedAt(reports);
      
      // Get numReports
      int numReports = reports.size();
      
      return new Product(
          sbomName,
          productId,
          cveId,
          cveStatusCounts,
          statusCounts,
          completedAt,
          numReports,
          firstReportId
      );
    } catch (Exception e) {
      LOGGER.errorf("Error processing reports: %s", e.getMessage(), e);
      return null;
    }
  }

  private String extractReportId(Document report) {
    // Extract MongoDB document _id instead of scan ID
    ObjectId id = report.get(RepositoryConstants.ID_KEY, ObjectId.class);
    if (id != null) {
      return id.toHexString();
    }
    return null;
  }

  private String extractSbomName(Document report) {
    Document metadata = report.get("metadata", Document.class);
    if (metadata != null) {
      return metadata.getString(SBOM_NAME);
    }
    return null;
  }

  private String extractCveId(Document report) {
    Document input = report.get("input", Document.class);
    if (input != null) {
      Document scan = input.get("scan", Document.class);
      if (scan != null) {
        @SuppressWarnings("unchecked")
        List<Document> vulns = scan.getList("vulns", Document.class);
        if (vulns != null && !vulns.isEmpty()) {
          Document firstVuln = vulns.get(0);
          return firstVuln.getString("vuln_id");
        }
      }
    }
    return null;
  }

  private Map<String, Integer> buildCveStatusCounts(List<Document> reports) {
    Map<String, Integer> counts = new HashMap<>();
    
    for (Document report : reports) {
      Document output = report.get("output", Document.class);
      if (output != null) {
        @SuppressWarnings("unchecked")
        List<Document> analysis = output.getList("analysis", Document.class);
        if (analysis != null && !analysis.isEmpty()) {
          Document firstAnalysis = analysis.get(0);
          Document justification = firstAnalysis.get("justification", Document.class);
          if (justification != null) {
            String status = justification.getString("status");
            if (status != null && !status.isEmpty()) {
              counts.merge(status, 1, Integer::sum);
            }
          }
        }
      }
    }
    
    return counts;
  }

  private Map<String, Integer> buildStatusCounts(List<Document> reports) {
    Map<String, Integer> counts = new HashMap<>();
    
    for (Document report : reports) {
      Map<String, String> metadata = reportRepositoryService.extractMetadata(report);
      String status = reportRepositoryService.getStatus(report, metadata);
      counts.merge(status, 1, Integer::sum);
    }
    
    return counts;
  }

  private String calculateCompletedAt(List<Document> reports) {
    String latestCompletedAt = null;
    boolean hasEmpty = false;
    
    for (Document report : reports) {
      Document input = report.get("input", Document.class);
      if (input != null) {
        Document scan = input.get("scan", Document.class);
        if (scan != null) {
          String completedAt = scan.getString("completed_at");
          if (completedAt == null || completedAt.isEmpty()) {
            hasEmpty = true;
          } else {
            if (latestCompletedAt == null || completedAt.compareTo(latestCompletedAt) > 0) {
              latestCompletedAt = completedAt;
            }
          }
        }
      }
    }
    
    return hasEmpty ? "" : (latestCompletedAt != null ? latestCompletedAt : "");
  }
}
