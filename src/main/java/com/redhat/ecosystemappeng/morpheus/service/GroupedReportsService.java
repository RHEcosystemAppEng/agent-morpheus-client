package com.redhat.ecosystemappeng.morpheus.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.bson.conversions.Bson;
import org.jboss.logging.Logger;

import com.mongodb.client.model.Accumulators;
import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.redhat.ecosystemappeng.morpheus.model.GroupedReportRow;
import com.redhat.ecosystemappeng.morpheus.model.PaginatedResult;
import com.redhat.ecosystemappeng.morpheus.model.Pagination;
import com.redhat.ecosystemappeng.morpheus.model.SortType;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class GroupedReportsService {

  private static final Logger LOGGER = Logger.getLogger(GroupedReportsService.class);
  private static final String PRODUCT_ID = "product_id";
  private static final String SBOM_NAME = "sbom_name";

  @Inject
  ReportRepositoryService reportRepositoryService;

  public PaginatedResult<GroupedReportRow> getGroupedReports(String sortField, SortType sortType, Pagination pagination) {
    List<GroupedReportRow> groupedRows = new ArrayList<>();
    
    // Build filter for reports with product_id
    Bson filter = Filters.exists("metadata." + PRODUCT_ID, true);
    
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
          GroupedReportRow row = processGroup(groupDoc);
          if (row != null) {
            groupedRows.add(row);
          }
        });
    
    // Get total count of groups for pagination
    long totalGroups = getTotalGroupCount(filter);
    int totalPages = (int) Math.ceil((double) totalGroups / pagination.size());
    
    return new PaginatedResult<>(totalGroups, totalPages, groupedRows.stream());
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

  private GroupedReportRow processGroup(Document groupDoc) {
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
      
      Document firstReport = reports.get(0);
      
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
      
      return new GroupedReportRow(
          sbomName,
          productId,
          cveId,
          cveStatusCounts,
          statusCounts,
          completedAt,
          numReports
      );
    } catch (Exception e) {
      LOGGER.errorf("Error processing group: %s", e.getMessage(), e);
      return null;
    }
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

