package com.redhat.ecosystemappeng.morpheus.rest;

import java.io.InputStream;
import java.util.Objects;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.Product;
import com.redhat.ecosystemappeng.morpheus.service.ProductService;
import com.redhat.ecosystemappeng.morpheus.service.ProductProcessingService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.PathParam;

import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.jboss.logging.Logger;

@SecurityRequirement(name = "jwt")
@Path("/product")
@Produces(MediaType.APPLICATION_JSON)
public class ProductEndpoint {
  
  private static final Logger LOGGER = Logger.getLogger(ProductEndpoint.class);

  @Inject
  ProductService productService;

  @Inject
  ObjectMapper objectMapper;

  @Inject
  ProductProcessingService productProcessingService;

  @POST
  @Operation(
    summary = "Save product", 
    description = "Saves product metadata to database")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Save product metadata request accepted"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response save(
    @RequestBody(
      description = "Product metadata to save",
      required = true,
      content = @Content(schema = @Schema(implementation = Product.class))
    )
    Product product) {
    try {
      productService.save(product);
      return Response.accepted().build();
    } catch (Exception e) {
      LOGGER.error("Failed to save product to database", e);
      return Response.serverError().entity(objectMapper.createObjectNode().put("error", e.getMessage())).build();
    }
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
                        schema = @Schema(implementation = Product.class))
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
    Product product = productService.get(id);
    if (Objects.isNull(product)) {
      return Response.status(Response.Status.NOT_FOUND).build();
    }
    return Response.ok(product).build();
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
  @Path("/new")
  @Consumes(MediaType.MULTIPART_FORM_DATA)
  @Operation(
    summary = "Create new product from SPDX SBOM", 
    description = "Uploads an SPDX SBOM file, parses it, creates a product, and starts async processing. Requires a vulnerability ID to include in all component reports.")
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
      description = "Invalid SPDX file, missing required data, or missing vulnerability ID"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response newProduct(
    @Parameter(
      description = "SPDX SBOM file to upload",
      required = true
    )
    @FormParam("file") InputStream fileInputStream,
    @Parameter(
      description = "Vulnerability ID (e.g., CVE-2024-12345) to include in all component reports",
      required = true
    )
    @QueryParam("vulnerabilityId") String vulnerabilityId) {
    try {
      // Validate vulnerability ID is provided
      if (vulnerabilityId == null || vulnerabilityId.trim().isEmpty()) {
        return Response.status(Response.Status.BAD_REQUEST)
            .entity(objectMapper.createObjectNode().put("error", "vulnerabilityId is required"))
            .build();
      }
      
      String productId = productProcessingService.createProductFromSpdx(fileInputStream, vulnerabilityId);
      JsonNode response = objectMapper.createObjectNode().put("productId", productId);
      return Response.accepted(response).build();
    } catch (IllegalArgumentException e) {
      LOGGER.errorf("Invalid SPDX file: %s", e.getMessage());
      return Response.status(Response.Status.BAD_REQUEST)
          .entity(objectMapper.createObjectNode().put("error", e.getMessage()))
          .build();
    } catch (Exception e) {
      LOGGER.error("Failed to create product from SPDX", e);
      return Response.serverError()
          .entity(objectMapper.createObjectNode().put("error", e.getMessage()))
          .build();
    }
  }
} 
