/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.redhat.ecosystemappeng.morpheus.rest;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.Map;

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
import org.jboss.resteasy.reactive.multipart.FileUpload;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.exception.SbomValidationException;
import com.redhat.ecosystemappeng.morpheus.exception.ValidationException;
import com.redhat.ecosystemappeng.morpheus.model.InlineCredential;
import com.redhat.ecosystemappeng.morpheus.model.ProductSummary;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.service.CredentialProcessingService;
import com.redhat.ecosystemappeng.morpheus.service.CredentialStoreService;
import com.redhat.ecosystemappeng.morpheus.service.CredentialStorageException;
import com.redhat.ecosystemappeng.morpheus.repository.ProductRepositoryService;
import com.redhat.ecosystemappeng.morpheus.service.ProductService;
import com.redhat.ecosystemappeng.morpheus.service.ReportService;
import com.redhat.ecosystemappeng.morpheus.service.SbomReportService;
import com.redhat.ecosystemappeng.morpheus.service.UserService;
import com.redhat.ecosystemappeng.morpheus.service.UtilitiesService;
import com.redhat.ecosystemappeng.morpheus.service.RequestQueueExceededException;

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
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

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
  SbomReportService sbomProcessingService;

  @Inject
  ProductRepositoryService productRepository;

  @Inject
  ProductService productService;

  @Inject
  UserService userService;

  @Inject
  ObjectMapper objectMapper;

  @Inject
  CredentialStoreService credentialStoreService;

  @Inject
  CredentialProcessingService credentialProcessingService;

  @Context
  SecurityContext securityContext;

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
    description = "Accepts a CVE ID and CycloneDX JSON file with optional credentials for private repository access, validates them, and queues the report for analysis")
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
      @FormParam("file") FileUpload file,
      @FormParam("secretValue") String secretValue,
      @FormParam("userName") String userName) throws IOException {
    if (Objects.isNull(file) || Objects.isNull(file.uploadedFile())) {
      throw new ValidationException(Map.of("file", "File is required"));
    }

    try (InputStream fileInputStream = Files.newInputStream(file.uploadedFile())) {
      String credentialId = null;
      if (Objects.nonNull(secretValue) && !secretValue.isBlank()) {
        try {
          InlineCredential credential = new InlineCredential(secretValue, userName);
          String userId = UtilitiesService.getAuthenticatedUserName(securityContext, userService);
          credentialId = credentialProcessingService.processAndStoreCredential(credential, userId);
        } catch (IllegalArgumentException e) {
          LOGGER.warnf(e, "Credential validation failed");
          return Response.status(Response.Status.BAD_REQUEST)
            .entity(objectMapper.createObjectNode()
            .put("error", e.getMessage()))
            .build();
        } catch (CredentialStorageException e) {
          LOGGER.errorf(e, "Failed to store credential");
          return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(objectMapper.createObjectNode()
            .put("error", "Failed to store credential: " + e.getMessage()))
            .build();
        }
      }
      ReportData reportData = sbomProcessingService.submitCycloneDx(cveId, fileInputStream, credentialId);

      return Response.accepted(reportData).build();
    }
  }

  @ServerExceptionMapper
  public Response mapValidationException(ValidationException e) {    
    var errorNode = objectMapper.createObjectNode();
    var errorsNode = errorNode.putObject("errors");
    LOGGER.error(e.getMessage());
    if (e.getErrors() != null) {      
      e.getErrors().forEach(errorsNode::put);
    } 
    return Response.status(Response.Status.BAD_REQUEST)
        .entity(errorNode)
        .build();
  }

  @ServerExceptionMapper
  public Response mapIllegalArgumentException(IllegalArgumentException e) {
    LOGGER.errorf(e, "Input validation failed");
    return Response.status(Response.Status.BAD_REQUEST)
        .entity(objectMapper.createObjectNode()
            .put("error", "Input validation failed"))
        .build();
  }

  @ServerExceptionMapper
  public Response mapCredentialStorageException(CredentialStorageException e) {
    LOGGER.errorf(e, "Failed to store credential");
    return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
        .entity(objectMapper.createObjectNode()
            .put("error", "Failed to handle credentials"))
        .build();
  }

  @ServerExceptionMapper
  public Response mapIOException(IOException e) {
    LOGGER.errorf(e, "I/O error processing request");
    return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
        .entity(objectMapper.createObjectNode()
            .put("error", "Failed to read or process uploaded file"))
        .build();
  }

  @ServerExceptionMapper
  public Response mapException(Exception e) {
    LOGGER.error("Unexpected error in ProductEndpoint ", e);
    return Response.serverError()
        .entity(objectMapper.createObjectNode()
            .put("error", "Unexpected error"))
        .build();
  }

  @ServerExceptionMapper
  public Response mapSbomValidationException(SbomValidationException e) {
    LOGGER.errorf("Invalid SBOM: %s", e.getMessage());
    return Response.status(Response.Status.BAD_REQUEST)
        .entity(objectMapper.createObjectNode()
            .put("error", "Invalid SBOM: " + e.getMessage()))
        .build();
  }

  @POST
  @Path("/upload-spdx")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  @Operation(
    summary = "Create new product from SPDX SBOM", 
    description = "Uploads an SPDX SBOM file, parses it, creates a product, and starts async processing. Requires a vulnerability ID to include in all component reports. Accepts optional credentials for private repository access.")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Product creation request accepted",
      content = @Content(
        mediaType = MediaType.APPLICATION_JSON,
        schema = @Schema(
          type = SchemaType.OBJECT
        )
      )
    ),
    @APIResponse(
      responseCode = "400", 
      description = "Invalid SPDX file, missing required data, missing CVE ID, or credential validation error"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response newProduct(  
    @FormParam("cveId") String cveId,
    @Parameter(
      description = "SPDX SBOM file to upload",
      required = true
    )
    @FormParam("file") InputStream fileInputStream,
    @Parameter(
      description = "Optional authentication secret (SSH private key or Personal Access Token) for private repository access"
    )
    @FormParam("secretValue") String secretValue,
    @Parameter(
      description = "Optional username for Personal Access Token authentication"
    )
    @FormParam("userName") String userName) throws IOException {
      // Process credentials if provided (reuse same logic as CycloneDX)
      String credentialId = null;
      if (Objects.nonNull(secretValue) && !secretValue.isBlank()) {        
        InlineCredential credential = new InlineCredential(secretValue, userName);
        String userId = UtilitiesService.getAuthenticatedUserName(securityContext, userService);
        credentialId = credentialProcessingService.processAndStoreCredential(credential, userId);        
      }      
      String productId = sbomProcessingService.submitSpdx(fileInputStream, cveId, credentialId);
      JsonNode response = objectMapper.createObjectNode().put("productId", productId);
      return Response.accepted(response).build();
    
  }

  @ServerExceptionMapper
  public Response mapQueueExceededException(RequestQueueExceededException e) {
    LOGGER.errorf("Too many requests, limit exceeded");
    return Response.status(Response.Status.TOO_MANY_REQUESTS)
            .entity(objectMapper.createObjectNode()
                    .put("error", "Too many requests, limit exceeded"))
            .build();
  }
}
