package com.redhat.ecosystemappeng.morpheus.rest;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.enums.SecuritySchemeType;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.security.SecurityScheme;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.ClientWebApplicationException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.SbomReport;
import com.redhat.ecosystemappeng.morpheus.model.Pagination;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequest;
import com.redhat.ecosystemappeng.morpheus.model.SortType;
import com.redhat.ecosystemappeng.morpheus.model.ValidationErrorResponse;
import com.redhat.ecosystemappeng.morpheus.service.SbomReportsService;
import com.redhat.ecosystemappeng.morpheus.service.ReportService;
import com.redhat.ecosystemappeng.morpheus.service.RequestQueueExceededException;
import com.redhat.ecosystemappeng.morpheus.service.CycloneDxUploadService;
import com.redhat.ecosystemappeng.morpheus.service.ValidationException;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import java.io.InputStream;

@SecurityScheme(securitySchemeName = "jwt", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "jwt", description = "Please enter your JWT Token without Bearer")
@SecurityRequirement(name = "jwt")
@Path("/sbom-reports")
@Produces(MediaType.APPLICATION_JSON)
public class SbomReportEndpoint {

  private static final Logger LOGGER = Logger.getLogger(SbomReportEndpoint.class);

  private static final String PAGE = "page";
  private static final String PAGE_SIZE = "pageSize";

  @Inject
  SbomReportsService sbomReportsService;

  @Inject
  ObjectMapper objectMapper;

  @Inject
  CycloneDxUploadService cycloneDxUploadService;

  @Inject
  ReportService reportService;

  @GET
  @Operation(
    summary = "List SBOM reports", 
    description = "Retrieves a paginated list of reports grouped by sbom_report_id, filtered to only include reports with metadata.sbom_report_id, sorted by submittedAt, sbomName, or sbomReportId")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "SBOM reports retrieved successfully",
      content = @Content(
        schema = @Schema(type = SchemaType.ARRAY, implementation = SbomReport.class)
      )
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response listSbomReports(
      @Parameter(
        description = "Sort field: 'submittedAt', 'sbomName', or 'sbomReportId'"
      )
      @QueryParam("sortField") @DefaultValue("submittedAt") String sortField,
      @Parameter(
        description = "Sort direction: 'ASC' or 'DESC'"
      )
      @QueryParam("sortDirection") @DefaultValue("DESC") String sortDirection,
      @Parameter(
        description = "Page number (0-based)"
      )
      @QueryParam(PAGE) @DefaultValue("0") Integer page,
      @Parameter(
        description = "Number of items per page"
      )
      @QueryParam(PAGE_SIZE) @DefaultValue("100") Integer pageSize,
      @Parameter(
        description = "Filter by SBOM name (case-insensitive partial match)"
      )
      @QueryParam("sbomName") String sbomName,
      @Parameter(
        description = "Filter by CVE ID (case-insensitive partial match)"
      )
      @QueryParam("cveId") String cveId) {
    try {
      SortType sortType = SortType.valueOf(sortDirection.toUpperCase());
      var result = sbomReportsService.getSbomReports(sortField, sortType, new Pagination(page, pageSize), 
          sbomName, cveId);
      return Response.ok(result.results)
          .header("X-Total-Pages", result.totalPages)
          .header("X-Total-Elements", result.totalElements)
          .build();
    } catch (Exception e) {
      LOGGER.error("Unable to retrieve SBOM reports", e);
      return Response.serverError()
          .entity(objectMapper.createObjectNode()
          .put("error", e.getMessage()))
          .build();
    }
  }

  @GET
  @Path("/{sbomReportId}")
  @Operation(
    summary = "Get SBOM report by ID", 
    description = "Retrieves SBOM report data for a specific SBOM report ID")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "SBOM report retrieved successfully",
      content = @Content(
        schema = @Schema(type = SchemaType.OBJECT, implementation = SbomReport.class)
      )
    ),
    @APIResponse(
      responseCode = "404", 
      description = "SBOM report not found"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response getSbomReport(
      @Parameter(
        description = "SBOM report ID", 
        required = true
      )
      @PathParam("sbomReportId") String sbomReportId) {
    try {
      SbomReport sbomReport = sbomReportsService.getSbomReportById(sbomReportId);
      if (sbomReport == null) {
        return Response.status(Response.Status.NOT_FOUND).build();
      }
      return Response.ok(sbomReport).build();
    } catch (Exception e) {
      LOGGER.error("Unable to retrieve SBOM report", e);
      return Response.serverError()
          .entity(objectMapper.createObjectNode()
          .put("error", e.getMessage()))
          .build();
    }
  }

  @POST
  @Path("/upload-cyclonedx")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  @Operation(
    summary = "Upload CycloneDX file for analysis", 
    description = "Accepts a multipart form with CVE ID and CycloneDX file, validates the file structure, creates a report with SBOM report ID, and queues it for analysis")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "File uploaded and analysis request queued",
      content = @Content(
        schema = @Schema(implementation = ReportData.class)
      )
    ),
    @APIResponse(
      responseCode = "400", 
      description = "Invalid request data (invalid CVE format, invalid JSON, missing required fields)",
      content = @Content(
        schema = @Schema(implementation = ValidationErrorResponse.class)
      )
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
  public Response uploadCycloneDx(
    @Parameter(
      description = "CVE ID to analyze (must match the official CVE pattern CVE-YYYY-NNNN+)",
      required = true
    )
    @FormParam("cveId") String cveId,
    @Parameter(
      description = "CycloneDX JSON file",
      required = true
    )
    @FormParam("file") InputStream fileInputStream) {
    try {
      ReportRequest request = cycloneDxUploadService.processUpload(cveId, fileInputStream);
      ReportData res = reportService.process(request);
      reportService.submit(res.reportRequestId().id(), res.report());
      return Response.accepted(res).build();
    } catch (ValidationException e) {
      ValidationErrorResponse errorResponse = new ValidationErrorResponse(e.getErrors());
      return Response.status(Status.BAD_REQUEST)
        .entity(errorResponse)
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
      LOGGER.error("Unable to process CycloneDX file upload request", e);
      return Response.serverError()
        .entity(objectMapper.createObjectNode()
        .put("error", e.getMessage()))
        .build();
    }
  }
}

