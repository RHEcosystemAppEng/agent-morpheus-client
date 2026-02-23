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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.Product;
import com.redhat.ecosystemappeng.morpheus.model.ProductSummary;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.service.CycloneDxUploadService;
import com.redhat.ecosystemappeng.morpheus.repository.ProductRepositoryService;
import com.redhat.ecosystemappeng.morpheus.service.ProductService;
import com.redhat.ecosystemappeng.morpheus.service.ReportService;
import com.redhat.ecosystemappeng.morpheus.service.UserService;
import com.redhat.ecosystemappeng.morpheus.exception.ValidationException;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
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
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@SecurityScheme(securitySchemeName = "jwt", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "jwt", description = "Please enter your JWT Token without Bearer")
@SecurityRequirement(name = "jwt")
@Path("/products")
@Produces(MediaType.APPLICATION_JSON)
public class ProductEndpoint {
  
  private static final Logger LOGGER = Logger.getLogger(ProductEndpoint.class);

  @Inject
  ReportService reportService;

  @Inject
  CycloneDxUploadService cycloneDxUploadService;

  @Inject
  ProductRepositoryService productRepository;

  @Inject
  ProductService productService;

  @Inject
  UserService userService;

  @Inject
  ObjectMapper objectMapper;

  @GET
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
    var result = reportService.listProductSummaries(page, pageSize, sortField, sortDirection, name, cveId);
    
    // Calculate total pages
    long totalPages = (result.totalCount() + pageSize - 1) / pageSize;
    
    return Response.ok(result.summaries())
        .header("X-Total-Pages", String.valueOf(totalPages))
        .header("X-Total-Elements", String.valueOf(result.totalCount()))
        .build();
  }

  @GET
  @Path("/{id}")
  @Operation(
    summary = "Get product", 
    description = "Gets product by ID from database")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Product found in database",
      content = @Content(mediaType = MediaType.APPLICATION_JSON,
                        schema = @Schema(implementation = ProductSummary.class))
    ),
    @APIResponse(
      responseCode = "404", 
      description = "Product not found in database"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response get(
    @Parameter(
      description = "Product ID", 
      required = true
    )
    @PathParam("id") String id) {
    var summary = reportService.getProductSummary(id);
    if (summary == null) {
      return Response.status(Response.Status.NOT_FOUND).build();
    }
    return Response.ok(summary).build();
  }
  
  @DELETE
  @Path("/{id}")
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
  public Response remove(
    @Parameter(
      description = "Product ID", 
      required = true
    )
    @PathParam("id") String id) {
    productService.remove(id);
    return Response.accepted().build();
  }

  @POST
  @Path("/upload-cyclonedx")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  @Operation(
    summary = "Upload CycloneDX file for analysis",
    description = "Accepts a CVE ID and CycloneDX JSON file, validates them, and queues the report for analysis")
  @APIResponses({
    @APIResponse(
      responseCode = "202",
      description = "File uploaded and queued for analysis",
      content = @Content(
        schema = @Schema(implementation = ReportData.class)
      )
    ),
    @APIResponse(
      responseCode = "400",
      description = "Validation error with field-specific error messages"
    ),
    @APIResponse(
      responseCode = "500",
      description = "Internal server error"
    )
  })
  public Response uploadCyclonedx(
      @FormParam("cveId") String cveId,
      @FormParam("file") FileUpload file) throws IOException {
    if (file == null || file.uploadedFile() == null) {
      throw new ValidationException(Map.of("file", "File is required"));
    }

    try (InputStream fileInputStream = Files.newInputStream(file.uploadedFile())) {
      var reportRequest = cycloneDxUploadService.processUpload(cveId, fileInputStream);
      
      // Extract product information from report metadata
      Map<String, String> reportMetadata = reportRequest.metadata();
      String productId = reportMetadata.get("product_id");
      String sbomName = reportMetadata.get("sbom_name");
      String sbomVersion = reportMetadata.get("sbom_version");
      
      // Create and submit the report
      var reportData = reportService.process(reportRequest);
      reportService.submit(reportData.reportRequestId().id(), reportData.report());

      // Create product entry after report is successfully created and submitted
      // Product report is necessary for the UI display of SBOM report list
      // Use empty string as version fallback when version is not available from SBOM
      try {
        Product product = new Product(
          productId,
          sbomName,
          Objects.nonNull(sbomVersion) ? sbomVersion : "",
          Instant.now().toString(),
          1,
          new HashMap<String, String>(), // Explicitly specify HashMap generic types
          Collections.emptyList(),
          cveId
        );
        productRepository.save(product, userService.getUserName());
      } catch (Exception e) {
        // Log error but don't fail the request - product creation failure should not prevent report submission
        LOGGER.errorf(e, "Failed to create product %s after report creation", productId);
      }

      return Response.accepted(reportData).build();
    }
  }

  @ServerExceptionMapper
  public Response mapValidationException(ValidationException e) {
    var errorNode = objectMapper.createObjectNode();
    var errorsNode = errorNode.putObject("errors");
    if (e.getErrors() != null) {
      e.getErrors().forEach(errorsNode::put);
    }
    return Response.status(Response.Status.BAD_REQUEST)
        .entity(errorNode)
        .build();
  }

  @ServerExceptionMapper
  public Response mapException(Exception e) {
    LOGGER.error("Unexpected error in ProductEndpoint", e);
    return Response.serverError()
        .entity(objectMapper.createObjectNode()
            .put("error", e.getMessage()))
        .build();
  }
}