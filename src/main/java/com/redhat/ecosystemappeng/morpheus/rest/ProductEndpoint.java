package com.redhat.ecosystemappeng.morpheus.rest;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.zip.GZIPInputStream;

import org.bson.types.ObjectId;
import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.model.sbom.InvalidSbomException;
import com.redhat.ecosystemappeng.morpheus.model.sbom.Product;
import com.redhat.ecosystemappeng.morpheus.service.ProductRepositoryService;
import com.redhat.ecosystemappeng.morpheus.service.SbomParser;

import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.infrastructure.Infrastructure;
import jakarta.inject.Inject;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/products")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ProductEndpoint {

  private static final Logger LOGGER = Logger.getLogger(ProductEndpoint.class);
  
  @Inject
  ProductRepositoryService productRepository;

  @Inject
  SbomParser sbomParser;

  @PUT
  @Path("/{product}/{version}")
  @Consumes(MediaType.APPLICATION_OCTET_STREAM)

  public Response add(@PathParam("product") String product, @PathParam("version") String version,
      InputStream compressedStream) {
    Uni.createFrom().item(compressedStream).emitOn(Infrastructure.getDefaultWorkerPool()).subscribe().with(ce -> {
      try (GZIPInputStream gzip = new GZIPInputStream(ce)) {
        sbomParser.importSbom(product, version, gzip);
        LOGGER.infof("Completed import of SBOM %s : %s", product, version);
      } catch (IOException | InvalidSbomException e) {
        throw new ClientErrorException("Unable to parse recieved SBOM", Response.Status.BAD_REQUEST);
      }
    });
    return Response.accepted().build();
  }

  @GET
  public List<Product> list(@QueryParam("product") String product, @QueryParam("version") String version) {
    return productRepository.find(product, version);
  }

  @GET
  @Path("/{id}")
  public Product get(@PathParam("id") String id) {
    var product = productRepository.findById(new ObjectId(id));
    if (product != null) {
      return product;
    }
    throw new NotFoundException();
  }

}
