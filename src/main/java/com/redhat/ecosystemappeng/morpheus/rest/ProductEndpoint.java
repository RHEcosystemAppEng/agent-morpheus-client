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
import com.redhat.ecosystemappeng.morpheus.model.Pagination;
import com.redhat.ecosystemappeng.morpheus.model.SortType;
import com.redhat.ecosystemappeng.morpheus.service.ProductsService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@SecurityScheme(securitySchemeName = "jwt", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "jwt", description = "Please enter your JWT Token without Bearer")
@SecurityRequirement(name = "jwt")
@Path("/products")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ProductEndpoint {

  private static final Logger LOGGER = Logger.getLogger(ProductEndpoint.class);

  private static final String PAGE = "page";
  private static final String PAGE_SIZE = "pageSize";

  @Inject
  ProductsService productsService;

  @Inject
  ObjectMapper objectMapper;

  @GET
  @Operation(
    summary = "List products", 
    description = "Retrieves a paginated list of reports grouped by product_id, filtered to only include reports with metadata.product_id, sorted by completedAt or sbomName")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Products retrieved successfully",
      content = @Content(
        schema = @Schema(type = SchemaType.ARRAY, implementation = Product.class)
      )
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response listProducts(
      @Parameter(
        description = "Sort field: 'completedAt' or 'sbomName'"
      )
      @QueryParam("sortField") @DefaultValue("completedAt") String sortField,
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
      @QueryParam("cveId") String cveId,
      @Parameter(
        description = "Filter by ExploitIQ status. TODO: NOT YET IMPLEMENTED - This parameter is accepted but ignored. The filter appears in the UI but is disabled and has no backend implementation."
      )
      @QueryParam("exploitIqStatus") String exploitIqStatus,
      @Parameter(
        description = "Filter by analysis state. Valid values: completed, expired, failed, queued, sent, pending (comma-separated for multiple values)"
      )
      @QueryParam("analysisState") String analysisState) {
    try {
      SortType sortType = SortType.valueOf(sortDirection.toUpperCase());
      var result = productsService.getProducts(sortField, sortType, new Pagination(page, pageSize), 
          sbomName, cveId, exploitIqStatus, analysisState);
      return Response.ok(result.results)
          .header("X-Total-Pages", result.totalPages)
          .header("X-Total-Elements", result.totalElements)
          .build();
    } catch (Exception e) {
      LOGGER.error("Unable to retrieve products", e);
      return Response.serverError()
          .entity(objectMapper.createObjectNode()
          .put("error", e.getMessage()))
          .build();
    }
  }

  @GET
  @Path("/{productId}")
  @Operation(
    summary = "Get product by ID", 
    description = "Retrieves product data for a specific product ID")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Product retrieved successfully",
      content = @Content(
        schema = @Schema(type = SchemaType.OBJECT, implementation = Product.class)
      )
    ),
    @APIResponse(
      responseCode = "404", 
      description = "Product not found"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response getProduct(
      @Parameter(
        description = "Product ID", 
        required = true
      )
      @PathParam("productId") String productId) {
    try {
      Product product = productsService.getProductById(productId);
      if (product == null) {
        return Response.status(Response.Status.NOT_FOUND).build();
      }
      return Response.ok(product).build();
    } catch (Exception e) {
      LOGGER.error("Unable to retrieve product", e);
      return Response.serverError()
          .entity(objectMapper.createObjectNode()
          .put("error", e.getMessage()))
          .build();
    }
  }
}

