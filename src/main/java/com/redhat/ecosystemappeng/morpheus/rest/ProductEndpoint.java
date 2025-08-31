package com.redhat.ecosystemappeng.morpheus.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.Product;
import com.redhat.ecosystemappeng.morpheus.service.ProductService;
import java.util.Objects;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.jboss.logging.Logger;

@Path("/product")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ProductEndpoint {
  
  private static final Logger LOGGER = Logger.getLogger(ProductEndpoint.class);

  @Inject
  ProductService productService;

  @Inject
  ObjectMapper objectMapper;

  @POST
  public Response save(Product product) {
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
  public Response get(String id) {
    Product product = productService.get(id);
    if (Objects.isNull(product)) {
      return Response.status(Response.Status.NOT_FOUND).build();
    }
    return Response.ok(product).build();
  }

  @DELETE
  @Path("/{id}")
  public Response remove(String id) {
    productService.remove(id);
    return Response.accepted().build();
  }
} 