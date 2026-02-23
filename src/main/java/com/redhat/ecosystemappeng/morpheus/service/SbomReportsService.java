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
import com.mongodb.client.model.BsonField;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;
import com.redhat.ecosystemappeng.morpheus.model.SbomReport;
import com.redhat.ecosystemappeng.morpheus.model.PaginatedResult;
import com.redhat.ecosystemappeng.morpheus.model.Pagination;
import com.redhat.ecosystemappeng.morpheus.model.SortType;
import com.redhat.ecosystemappeng.morpheus.repository.ReportRepositoryService;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SbomReportsService {

  private static final Logger LOGGER = Logger.getLogger(SbomReportsService.class);
  private static final String SBOM_REPORT_ID = "sbom_report_id";
  private static final String SBOM_NAME = "sbom_name";
  private static final String SENT_AT = "sent_at";
  private static final String SUBMITTED_AT = "submitted_at";

  @Inject
  ReportRepositoryService reportRepositoryService;

  public PaginatedResult<SbomReport> getSbomReports(String sortField, SortType sortType, Pagination pagination,
      String sbomName, String cveId) {
    List<SbomReport> sbomReports = new ArrayList<>();
    
    List<Bson> filterConditions = new ArrayList<>();
    filterConditions.add(Filters.exists("metadata." + SBOM_REPORT_ID, true));
    
    List<Bson> filterOptions = new ArrayList<>();
    
    if (sbomName != null && !sbomName.trim().isEmpty()) {
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
    
    // Group by sbom_report_id, capturing first sort value for post-group sorting
    List<BsonField> groupAccumulators = new ArrayList<>();
    groupAccumulators.add(Accumulators.push("reports", "$$ROOT"));
    groupAccumulators.add(Accumulators.first("sortValue", "$" + sortFieldPath));
    pipeline.add(Aggregates.group(
        "$metadata." + SBOM_REPORT_ID,
        groupAccumulators.toArray(new BsonField[0])
    ));
    
    // Sort groups by the captured sort value
    Bson groupSort = sortType == SortType.ASC 
        ? Sorts.ascending("sortValue")
        : Sorts.descending("sortValue");
    pipeline.add(Aggregates.sort(groupSort));
    
    pipeline.add(Aggregates.skip(pagination.page() * pagination.size()));
    pipeline.add(Aggregates.limit(pagination.size()));
    
    // Execute aggregation
    reportRepositoryService.getCollection()
        .aggregate(pipeline)
        .forEach(groupDoc -> {
          SbomReport sbomReport = processGroup(groupDoc);
          if (sbomReport != null) {
            sbomReports.add(sbomReport);
          }
        });
    
    // Get total count of groups for pagination
    long totalGroups = getTotalGroupCount(filter);
    int totalPages = (int) Math.ceil((double) totalGroups / pagination.size());
    
    return new PaginatedResult<>(totalGroups, totalPages, sbomReports.stream());
  }

  public SbomReport getSbomReportById(String sbomReportId) {
    // Build filter for reports with specific sbom_report_id
    LOGGER.infof("Getting SBOM report by ID: %s", sbomReportId);
    Bson filter = Filters.eq("metadata." + SBOM_REPORT_ID, sbomReportId);
    
    // Collect all reports for this sbom_report_id
    List<Document> reports = new ArrayList<>();
    reportRepositoryService.getCollection()
        .find(filter)
        .forEach(reports::add);
    
    // If no reports found, return null
    if (reports.isEmpty()) {
      return null;
    }
    
    // Process reports directly (no need for aggregation since all have same sbom_report_id)
    return processReports(sbomReportId, reports);
  }

  private String getSortFieldPath(String sortField) {
    return switch (sortField) {
      case "submittedAt" -> "metadata.submitted_at";
      case "sbomName" -> "metadata." + SBOM_NAME;
      case "sbomReportId" -> "metadata." + SBOM_REPORT_ID;
      default -> "metadata.submitted_at";
    };
  }

  private long getTotalGroupCount(Bson filter) {
    List<Bson> countPipeline = new ArrayList<>();
    countPipeline.add(Aggregates.match(filter));
    countPipeline.add(Aggregates.group("$metadata." + SBOM_REPORT_ID));
    
    long count = 0;
    for (@SuppressWarnings("unused") Document doc : reportRepositoryService.getCollection().aggregate(countPipeline)) {
      count++;
    }
    return count;
  }

  private SbomReport processGroup(Document groupDoc) {
    try {
      String sbomReportId = groupDoc.getString("_id");
      if (sbomReportId == null || sbomReportId.isEmpty()) {
        return null;
      }
      
      List<Document> reports = groupDoc.getList("reports", Document.class);
      if (reports == null || reports.isEmpty()) {
        return null;
      }
      
      return processReports(sbomReportId, reports);
    } catch (Exception e) {
      LOGGER.errorf("Error processing group: %s", e.getMessage(), e);
      return null;
    }
  }

  private SbomReport processReports(String sbomReportId, List<Document> reports) {
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
      
      // Extract submittedAt from first report
      String submittedAt = extractSubmittedAt(firstReport);
      
      // Get numReports
      int numReports = reports.size();
      
      return new SbomReport(
          sbomName,
          sbomReportId,
          cveId,
          cveStatusCounts,
          statusCounts,
          completedAt,
          submittedAt,
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
        List<Document> vulns = scan.getList("vulns", Document.class);
        if (vulns != null && !vulns.isEmpty()) {
          Document firstVuln = vulns.get(0);
          return firstVuln.getString("vuln_id");
        }
      }
    }
    return null;
  }

  private String extractSubmittedAt(Document report) {
    Document metadata = report.get("metadata", Document.class);
    if (metadata != null) {
      Object submittedAtObj = metadata.get("submitted_at");
      if (submittedAtObj != null) {
        // Handle both String and Date/Instant types (MongoDB stores dates as Date objects)
        if (submittedAtObj instanceof String) {
          return (String) submittedAtObj;
        } else if (submittedAtObj instanceof java.util.Date) {
          return ((java.util.Date) submittedAtObj).toInstant().toString();
        } else {
          return submittedAtObj.toString();
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

