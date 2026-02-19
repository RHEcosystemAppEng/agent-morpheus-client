package com.redhat.ecosystemappeng.morpheus.rest;

import java.util.List;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Objects;

import com.redhat.ecosystemappeng.morpheus.tracing.TraceToMdc;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.enums.SecuritySchemeType;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.security.SecurityScheme;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.ClientWebApplicationException;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequest;
import com.redhat.ecosystemappeng.morpheus.model.SortField;
import com.redhat.ecosystemappeng.morpheus.service.PreProcessingService;
import com.redhat.ecosystemappeng.morpheus.service.ProductService;
import com.redhat.ecosystemappeng.morpheus.service.ReportService;
import com.redhat.ecosystemappeng.morpheus.service.RequestQueueExceededException;
import com.redhat.ecosystemappeng.morpheus.model.Report;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequestId;
import com.redhat.ecosystemappeng.morpheus.model.ReportWithStatus;
import com.redhat.ecosystemappeng.morpheus.model.ProductSummary;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.ServerErrorException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.core.Response.Status;

@SecurityScheme(securitySchemeName = "jwt", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "jwt", description = "Please enter your JWT Token without Bearer")
@SecurityRequirement(name = "jwt")
@Path("/reports")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ReportEndpoint {

  private static final Logger LOGGER = Logger.getLogger(ReportEndpoint.class);

  private static final String SORT_BY = "sortBy";
  private static final String PAGE = "page";
  private static final String PAGE_SIZE = "pageSize";

  private static final Set<String> FIXED_QUERY_PARAMS = Set.of(SORT_BY, PAGE, PAGE_SIZE);

  @Inject
  NotificationSocket notificationSocket;

  @Inject
  ReportService reportService;

  @Inject
  PreProcessingService preProcessingService;

  @Inject
  ProductService productService;

  @Inject
  ObjectMapper objectMapper;

  @POST
  @Path("/new")
  @Operation(
    summary = "Create new analysis request", 
    description = "Creates a new analysis report request, processes it and optionally submits it to ExploitIQ for analysis")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Analysis request accepted",
      content = @Content(
        schema = @Schema(implementation = ReportData.class)
      )
    ),
    @APIResponse(
      responseCode = "400", 
      description = "Invalid request data"
    ),
    @APIResponse(
      responseCode = "429", 
      description = "Request queue exceeded"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response newRequest(
    @Parameter(
      description = "Whether to submit to ExploitIQ for analysis"
    )
    @QueryParam("submit") @DefaultValue("true") boolean sendToMorpheus, 
    @RequestBody(
      description = "Analysis report request data",
      required = true,
      content = @Content(schema = @Schema(implementation = ReportRequest.class))
    )
    ReportRequest request) {
    try {
      ReportData res = reportService.process(request);

      if (sendToMorpheus) {
        reportService.submit(res.reportRequestId().id(), res.report());
      }

      return Response.accepted(res).build();
    } catch (IllegalArgumentException e) {
      return Response.status(Status.BAD_REQUEST)
        .entity(objectMapper.createObjectNode()
        .put("error", e.getMessage()))
        .build();
    } catch (ClientWebApplicationException e) {
      return Response.status(e.getResponse().getStatus())
        .entity(e.getResponse().getEntity())
        .build();
    } catch (RequestQueueExceededException e) {
      return Response.status(Status.TOO_MANY_REQUESTS)
        .entity(objectMapper.createObjectNode()
        .put("error", e.getMessage()))
        .build();
    } catch (Exception e) {
      LOGGER.error("Unable to process new analysis request", e);
      return Response.serverError()
        .entity(objectMapper.createObjectNode()
        .put("error", e.getMessage()))
        .build();
    }
  }

  @POST
  @Path("/{id}/retry")
  @Operation(
    summary = "Retry analysis request", 
    description = "Retries an existing analysis request by ID")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Retry request accepted",
      content = @Content(
        schema = @Schema(
          type = SchemaType.STRING,
          example = "66155fd9639dbb7e7e4e44b8"
        )
      )
    ),
    @APIResponse(
      responseCode = "404", 
      description = "Request not found",
      content = @Content(
        schema = @Schema(
          type = SchemaType.STRING,
          example = "66155fd9639dbb7e7e4e44b8"
        )
      )
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response retry(
    @Parameter(
      description = "Report ID to retry (24-character hexadecimal MongoDB ObjectId format)", 
      required = true
    )
    @PathParam("id") String id) {
    try {
      if (reportService.retry(id)) {
        return Response.accepted(id).build();
      }
    } catch (JsonProcessingException e) {
      throw new ServerErrorException(Status.INTERNAL_SERVER_ERROR, e);
    }
    throw new NotFoundException(id);
  }

  @TraceToMdc
  @POST
  @Operation(
    summary = "Receive analysis report", 
    description = "Receives a completed analysis report from Morpheus")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Report received",
      content = @Content(
        schema = @Schema(implementation = ReportRequestId.class)
      )
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response receive(
    @Parameter(
      description = "Analysis report data in JSON String format",
      required = true,
      example = """
        {
          "input": {
            "scan": {...
            },
            "image": {...
            }
          },
          "output": {
            "analysis": [...],
            "vex": null | {...}
          },
          "info": {...
          },
          "metadata": {...
          }
        }
        """
    )
    String report) {
    var reqId = reportService.receive(report);
    LOGGER.debugf("Received report { id: %s | report_id: %s }", reqId.id(), reqId.reportId());
    return Response.accepted(reqId).build();
  }


  @GET
  @Operation(
    summary = "List analysis reports", 
    description = "Retrieves a paginated list of analysis reports with optional filtering and sorting")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Reports retrieved successfully",
      content = @Content(
        schema = @Schema(type = SchemaType.ARRAY, implementation = Report.class)
      )
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response list(
      @Context UriInfo uriInfo,
      @Parameter(
        description = "Sort criteria in format 'field:direction'"
      )
      @QueryParam(SORT_BY) @DefaultValue("submittedAt:DESC") List<String> sortBy,
      @Parameter(
        description = "Page number (0-based)"
      )
      @QueryParam(PAGE) @DefaultValue("0") Integer page,
      @Parameter(
        description = "Number of items per page"
      )
      @QueryParam(PAGE_SIZE) @DefaultValue("100") Integer pageSize,
      @Parameter(
        description = "Filter by report ID (input.scan.id)"
      )
      @QueryParam("reportId") String reportId,
      @Parameter(
        description = "Filter by vulnerability ID (CVE ID)"
      )
      @QueryParam("vulnId") String vulnId,
      @Parameter(
        description = "Filter by status. Valid values: completed, sent, failed, queued, expired, pending"
      )
      @QueryParam("status") String status,
      @Parameter(
        description = "Filter by image name"
      )
      @QueryParam("imageName") String imageName,
      @Parameter(
        description = "Filter by image tag"
      )
      @QueryParam("imageTag") String imageTag,
      @Parameter(
        description = "Filter by SBOM report ID (metadata.product_id)"
      )
      @QueryParam("productId") String productId,
      @Parameter(
        description = "Filter by ExploitIQ status. Valid values: TRUE, FALSE, UNKNOWN"
      )
      @QueryParam("exploitIqStatus") String exploitIqStatus) {

    var filter = uriInfo.getQueryParameters().entrySet().stream()
        .filter(e -> !FIXED_QUERY_PARAMS.contains(e.getKey()))
        .collect(Collectors.toMap(
            Entry::getKey,
            e -> e.getValue().size() > 1 
              ? String.join(",", e.getValue()) 
              : e.getValue().getFirst()
        ));
    var result = reportService.list(filter, SortField.fromSortBy(sortBy), page, pageSize);
    return Response.ok(result.results)
        .header("X-Total-Pages", result.totalPages)
        .header("X-Total-Elements", result.totalElements)
        .build();
  }


  @GET
  @Path("/{id}")
  @Operation(
    summary = "Get analysis report", 
    description = "Retrieves a specific analysis report by ID with calculated analysis status")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Report retrieved successfully",
      content = @Content(
        schema = @Schema(implementation = ReportWithStatus.class)
      )
    ),
    @APIResponse(
      responseCode = "404", 
      description = "Report not found"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public ReportWithStatus get(
    @Parameter(
      description = "Report ID to get (24-character hexadecimal MongoDB ObjectId format)", 
      required = true
    )
    @PathParam("id") String id) throws InterruptedException {
    var reportWithStatus = reportService.getWithStatus(id);
    if (Objects.isNull(reportWithStatus)) {
      throw new NotFoundException(id);
    }
    return reportWithStatus;
  }

  @GET
  @Path("/product/{id}")
  @Operation(
    summary = "Get product data by ID", 
    description = "Retrieves product data for a specific product ID")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Product data retrieved successfully",
      content = @Content(
        schema = @Schema(type = SchemaType.OBJECT, implementation = ProductSummary.class)
      )
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response listProduct(
    @Parameter(
      description = "Product ID", 
      required = true
    )
    @PathParam("id") String id) throws InterruptedException {
    try {
      var result = reportService.getProductSummary(id);
      if (Objects.isNull(result) || Objects.isNull(result.data())) {
        return Response.status(Response.Status.NOT_FOUND).build();
      }
      return Response.ok(result).build();
    } catch (Exception e) {
      LOGGER.error("Unable to retrieve product", e);
      return Response.serverError()
          .entity(objectMapper.createObjectNode()
              .put("error", e.getMessage()))
          .build();
    }
  }

  @GET
  @Path("/product")
  @Operation(
    summary = "List all product data", 
    description = "Retrieves paginated, sortable, and filterable product data for all products")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Product data retrieved successfully",
      content = @Content(
        schema = @Schema(type = SchemaType.ARRAY, implementation = ProductSummary.class)
      )
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response listProducts(
      @QueryParam("page") @DefaultValue("0") Integer page,
      @QueryParam("pageSize") @DefaultValue("100") Integer pageSize,
      @QueryParam("sortField") @DefaultValue("submittedAt") String sortField,
      @QueryParam("sortDirection") @DefaultValue("DESC") String sortDirection,
      @QueryParam("name") String name,
      @QueryParam("cveId") String cveId) {
    try {
      var result = reportService.listProductSummaries(page, pageSize, sortField, sortDirection, name, cveId);
      
      // Calculate total pages
      long totalPages = (result.totalCount() + pageSize - 1) / pageSize;
      
      return Response.ok(result.summaries())
          .header("X-Total-Pages", String.valueOf(totalPages))
          .header("X-Total-Elements", String.valueOf(result.totalCount()))
          .build();
    } catch (Exception e) {
      LOGGER.error("Unable to retrieve products", e);
      return Response.serverError()
          .entity(objectMapper.createObjectNode()
              .put("error", e.getMessage()))
          .build();
    }
  }

  @POST
  @Path("/{id}/submit")
  @Operation(
    summary = "Submit to ExploitIQ for analysis", 
    description = "Submits analysis request to ExploitIQ for analysis")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Request submitted successfully",
      content = @Content(
        schema = @Schema(
          type = SchemaType.STRING,
          example = "66155fd9639dbb7e7e4e44b8"
        )
      )
    ),
    @APIResponse(
      responseCode = "400", 
      description = "Invalid request data"
    ),
    @APIResponse(
      responseCode = "404", 
      description = "Request payload not found"
    ),
    @APIResponse(
      responseCode = "429", 
      description = "Request queue exceeded"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response submit(
    @Parameter(
      description = "Request payload (report) ID to submit (24-character hexadecimal MongoDB ObjectId format)", 
      required = true
    )
    @PathParam("id") String id) {
    preProcessingService.confirmResponse(id);
    
    var reportJson = reportService.get(id); 
    if (Objects.isNull(reportJson)) {
      preProcessingService.handleError(id, "report-not-found-error", "No report exists for ID " + id + " for submission.");

      return Response.status(Response.Status.NOT_FOUND)
      .entity(objectMapper.createObjectNode()
      .put("error", "Report with ID " + id + " not found."))
      .build();
    }
    
    try {
      JsonNode reportJsonNode = objectMapper.readTree(reportJson);
      reportService.submit(id, reportJsonNode);

      return Response.accepted(id).build();
    } catch (IllegalArgumentException e) {
      return Response.status(Status.BAD_REQUEST)
        .entity(objectMapper.createObjectNode()
        .put("error", e.getMessage()))
        .build();
    } catch (ClientWebApplicationException e) {
      return Response.status(e.getResponse().getStatus())
        .entity(e.getResponse().getEntity())
        .build();
    } catch (RequestQueueExceededException e) {
      return Response.status(Status.TOO_MANY_REQUESTS)
        .entity(objectMapper.createObjectNode()
        .put("error", e.getMessage()))
        .build();
    } catch (Exception e) {
      LOGGER.error("Unable to submit new analysis request", e);
      return Response.serverError()
        .entity(objectMapper.createObjectNode()
        .put("error", e.getMessage()))
        .build();
    }
  }

  @POST
  @Path("/{id}/failed")
  @Consumes(MediaType.TEXT_PLAIN)
  @Operation(
    summary = "Mark analysis request as failed", 
    description = "Marks an analysis request as failed with error details")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Failure status record accepted",
      content = @Content(
        schema = @Schema(
          type = SchemaType.STRING,
          example = "66155fd9639dbb7e7e4e44b8"
        )
      )
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response failed(
    @Parameter(
      description = "Report ID to mark as failed (24-character hexadecimal MongoDB ObjectId format)", 
      required = true
    )
    @PathParam("id") String id, 
    @Parameter(
      description = "Error message describing the failure",
      required = true
    )
    @QueryParam("errorMessage") String errorMessage) {
    preProcessingService.confirmResponse(id);
    
    preProcessingService.handleError(id, "component-syncer-processing-error", errorMessage);
    return Response.accepted(id).build();
  }

  @DELETE
  @Path("/{id}")
  @Operation(
    summary = "Delete analysis report", 
    description = "Deletes a specific analysis report by ID")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Report deletion request accepted"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response remove(
    @Parameter(
      description = "Report ID to delete (24-character hexadecimal MongoDB ObjectId format)", 
      required = true
    )
    @PathParam("id") String id) {
    if (reportService.remove(id)) {
      return Response.accepted().build();
    }
    return Response.serverError().build();
  }

  @DELETE
  @Operation(
    summary = "Delete multiple analysis reports", 
    description = "Deletes multiple analysis reports by IDs or using filter parameters")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Reports deletion request accepted"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response removeMany(
    @Parameter(
      description = "List of report IDs to delete (24-character hexadecimal MongoDB ObjectId format)"
    )
    @QueryParam("reportIds") List<String> reportIds, 
    @Context UriInfo uriInfo) {
    if (reportIds.isEmpty()) {
      var filter = uriInfo.getQueryParameters().entrySet().stream()
          .filter(e -> !FIXED_QUERY_PARAMS.contains(e.getKey()))
          .collect(Collectors.toMap(Entry::getKey, e -> e.getValue().getFirst()));
      reportService.remove(filter);
    } else {
      reportService.remove(reportIds);
    }
    return Response.accepted().build();
  }

  @DELETE
  @Path("/product")
  @Operation(
    summary = "Delete product by IDs", 
    description = "Deletes all component analysis reports and product metadata associated with specified product IDs")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Product deletion request accepted"
    ),
    @APIResponse(
      responseCode = "400", 
      description = "Invalid request - no product IDs provided"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response removeManyByProductId(
    @Parameter(
      description = "List of product IDs to delete", 
      required = true
    )
    @QueryParam("productIds") List<String> productIds) {
    if (Objects.isNull(productIds) || productIds.isEmpty()) {
      return Response.status(Status.BAD_REQUEST)
        .entity(objectMapper.createObjectNode()
        .put("error", "No productIds provided"))
        .build();
    }
    List<String> reportIds = reportService.getReportIds(productIds);
    if (Objects.isNull(reportIds) || reportIds.isEmpty()) {
      return Response.accepted().build();
    }
    reportService.remove(reportIds);
    productService.remove(productIds);
    return Response.accepted().build();
  }

  @DELETE
  @Path("/product/{id}")
  @Operation(
    summary = "Delete product by ID", 
    description = "Deletes all component analysis reports and product metadata associated with a specific product ID")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Product deletion request accepted"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response removeByProductId(
    @Parameter(
      description = "Product ID to delete", 
      required = true
    )
    @PathParam("id") String id) {
    List<String> reportIds = reportService.getReportIds(List.of(id));
    if (Objects.isNull(reportIds) || reportIds.isEmpty()) {
      return Response.accepted().build();
    }
    reportService.remove(reportIds);
    productService.remove(id);
    return Response.accepted().build();
  }

  @ServerExceptionMapper
  public Response mapException(Exception e) {
    LOGGER.error("Unexpected error in ReportEndpoint", e);
    return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
        .entity(objectMapper.createObjectNode()
            .put("error", e.getMessage() != null ? e.getMessage() : "An unexpected error occurred"))
        .build();
  }
}
