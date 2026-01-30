package com.redhat.ecosystemappeng.morpheus.rest.audit;

import com.redhat.ecosystemappeng.morpheus.model.audit.Batch;
import com.redhat.ecosystemappeng.morpheus.model.audit.BatchType;
import com.redhat.ecosystemappeng.morpheus.model.audit.Job;
import com.redhat.ecosystemappeng.morpheus.service.audit.BatchService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
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

import java.net.URI;
import java.util.List;

import static com.redhat.ecosystemappeng.morpheus.service.audit.AuditService.REGEX_ALLOWED_LANGUAGES;


@SecurityScheme(securitySchemeName = "jwt", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "jwt", description = "Please enter your JWT Token without Bearer")
@SecurityRequirement(name = "jwt")
@Path("/batch")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class BatchEndpoint extends BaseAuditEndpoint {

  private static final Logger LOGGER = Logger.getLogger(BatchEndpoint.class);

  @Inject
  BatchService batchService;

  @Context
  UriInfo info;


    @POST
  @Operation(
    summary = "Create one Batch containing metadata of multiple analysis jobs runs",
    description = "Creates 1 batch audit data")
  @APIResponses({
    @APIResponse(
      responseCode = "201",
      description = "Batch creation succeeded"
    ),
    @APIResponse(
      responseCode = "400",
      description = "Invalid request data in request body - validation error"
    ),
    @APIResponse(
      responseCode = "500",
      description = "Internal server error"
    )
  })
  public Response saveOne(
    @RequestBody(
      description = "Batch of jobs analysis runs metadata")
      @Valid Batch batch) {

        batchService.save(batch);
        return Response.created(URI.create(String.format("%s/%s",this.info.getRequestUri().toString() , batch.getBatchId()))).build();
  }


  @GET
  @Path("/all")
  @Operation(
    summary = "Get Batch documents containing metadata of jobs analysis runs ",
    description = "Retrieves a list of audit metadata Batches documents " +
            "by several filtering combinations, by specific Language or not (mixed batch languages)" +
            ", or just all batches regardless of the language" +
            "or all documents if none of the query-parameters are supplied")
  @APIResponses({
    @APIResponse(
      responseCode = "200",
      description = "Batches retrieved successfully",
      content = @Content(
        schema = @Schema(type = SchemaType.ARRAY, implementation = Job.class)
      )
    ),

    @APIResponse(
      responseCode = "400",
      description = "Bad request - Wrong assignment of query parameters",
      content = @Content(
        schema = @Schema(type = SchemaType.OBJECT, implementation = String.class)
      )
    ),


    @APIResponse(
      responseCode = "500",
      description = "Internal server error",
      content = @Content(schema = @Schema(type = SchemaType.OBJECT, implementation = String.class))
    )
  })
  public List<Batch> list(
      @Parameter(
        description = "if supplied, fetch batches documents of the given language or mixed languages batches documents"
      )
      @Valid @Pattern (regexp = REGEX_ALLOWED_LANGUAGES)@QueryParam("language") @DefaultValue("") String language)

          {
           return batchService.routeAllEndpointToServiceMethod(language);

  }

  @GET
  @Path("/{id}")
  @Operation(
    summary = "Get Batch of jobs run metadata",
    description = "Retrieves a specific batch of jobs runs metadata by batchId")
  @APIResponses({
    @APIResponse(
      responseCode = "200",
      description = "Batch retrieved successfully",
      content = @Content(
        schema = @Schema(
          type = SchemaType.OBJECT,
          implementation = Batch.class
          )
      )
    ),
    @APIResponse(
      responseCode = "404",
      description = "Batch not found", content = @Content(schema = @Schema(type = SchemaType.OBJECT, implementation = String.class))
    ),
    @APIResponse(
      responseCode = "500",
      description = "Internal server error",
      content = @Content(schema = @Schema(type = SchemaType.OBJECT, implementation = String.class))
    )
  })
  public Batch get(
    @Parameter(
      description = "Batch ID to get",
      required = true
    )
    @PathParam("id") String id)  {
      return batchService.getByBatchId(id);
  }

  @GET
  @Path("/latest")
  @Operation(
    summary = "Get recent batch run metadata of batch based on specific language or mixed languages batches.",
    description = "Retrieves the most recent batch run metadata according to specific language or not")
  @APIResponses({
    @APIResponse(
      responseCode = "200",
      description = "Batch retrieved successfully",
      content = @Content(
        schema = @Schema(
          type = SchemaType.OBJECT,
          implementation = Batch.class
          )
      )
    ),
    @APIResponse(
      responseCode = "404",
      description = "Batch not found", content = @Content(schema = @Schema(type = SchemaType.OBJECT, implementation = String.class))
    ),
    @APIResponse(
      responseCode = "500",
      description = "Internal server error", content = @Content(schema = @Schema(type = SchemaType.OBJECT, implementation = String.class))
    )
  })
  public Batch getRecentBatchId(
          @Parameter(
      description = "the language of the batch run, for returning the recent batch run of mixed languages batches, pass 'all'",
      required = true
    )
    @Valid @Pattern (regexp = REGEX_ALLOWED_LANGUAGES) @QueryParam("language") String language,
          @Parameter(
                  description = "the Batch type of the batch run, for returning the recent batch run of mixed languages batches",
                  required = true
          )
          @QueryParam("batch_type") BatchType batchType)  {
      return batchService.routeLatestToServiceMethod(language, batchType);
  }



  @DELETE
  @Path("/{id}")
  @Operation(
    summary = "Delete batch document metadata",
    description = "Deletes a specific batch of jobs analysis runs metadata by Internal DB id")
  @APIResponses({
    @APIResponse(
      responseCode = "202",
      description = "Batch deletion request accepted"
    ),
    @APIResponse(
      responseCode = "500",
      description = "Internal server error", content = @Content(schema = @Schema(type = SchemaType.OBJECT, implementation = String.class))
    )
  })
  public Response remove(
    @Parameter(
      description = "Batch id to delete (unique batch identifier of the multiple jobs analysis runs )",
      required = true
    )
    @PathParam("id") String batchId) {
     batchService.removeByBatchId(batchId);
     return Response.accepted().build();
  }

}
