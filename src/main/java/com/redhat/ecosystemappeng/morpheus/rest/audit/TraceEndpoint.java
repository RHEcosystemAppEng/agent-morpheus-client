package com.redhat.ecosystemappeng.morpheus.rest.audit;

import com.redhat.ecosystemappeng.morpheus.model.audit.Trace;
import com.redhat.ecosystemappeng.morpheus.service.audit.TraceService;
import io.vertx.core.cli.annotations.Hidden;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
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
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.RestHeader;

import java.util.List;

import static com.redhat.ecosystemappeng.morpheus.service.audit.AuditService.REGEX_PATTERN_FOR_CVE;


@SecurityScheme(securitySchemeName = "jwt", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "jwt", description = "Please enter your JWT Token without Bearer")
@SecurityRequirement(name = "jwt")
@Path("/traces")
@Tag(name = "ML-OPS Audit 3 - Trace Resource", description = "resource related to ML-OPS traces and span entries created in agent job runs and with its respective operations")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class TraceEndpoint extends BaseAuditEndpoint {

  private static final Logger LOGGER = Logger.getLogger(TraceEndpoint.class);

  @Inject
  TraceService traceService;

  @POST
  @Operation(
    summary = "Create List of new traces/spans metrics data of certain stages in certain analysis job runs ",
    description = "Creates multiple traces and spans containing telemetry data about certain analysis job runs")
  @APIResponses({
    @APIResponse(
      responseCode = "202",
      description = "traces creation accepted"
    ),
    @APIResponse(
      responseCode = "400", 
      description = "Invalid request data in request body - validation error"
    ),

    @APIResponse(
      responseCode = "422",
      description = "Traces objects are unprocessable - Cannot insert Traces objects to DB due to existence of at least one jobId that doesn't exists in DB"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response saveMany(
    @Parameter(
      description = "Request body of many Traces payload data, each one of a certain span inside LLM Stage in a single pipeline run",
      required = true,
      schema = @Schema(type = SchemaType.ARRAY, implementation = Trace.class)
    )
    @RequestBody(
      description = "span data of a certain unit of work/function inside a LLM Stage of single job Analysis run",
      required = true)
    @Valid
     List<Trace> traces,
     @RestHeader("Bypass-Referential-Integrity-Check") String bypassReferentialIntegrityCheck) {
      boolean skipReferentialIntegrity = Boolean.parseBoolean(bypassReferentialIntegrityCheck);
      traceService.saveMany(traces, skipReferentialIntegrity);
        return Response.accepted().build();

  }


  @GET
  @Path("/all")
  @Operation(
    summary = "Get trace + spans data documents containing telemetry data of all stages inside agent job runs ",
    description = "Retrieves a list of trace+span documents" +
            "by several filtering combinations, by jobId ( all traces and spans of a single job id), by traceId ( all spans of a particular traceId/Pipeline Stage" +
            "or all eval documents if none of the query-parameters are supplied")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Traces retrieved successfully",
      content = @Content(
        schema = @Schema(type = SchemaType.ARRAY, implementation = Trace.class)
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
      description = "Internal server error"
    )
  })
  public List<Trace> list(
      @Parameter(
        description = "If supplied , fetch trace documents of analysis runs of the given jobId"
      )
      @QueryParam("jobId") @DefaultValue("") String jobId,
      @Parameter(
        description = "If supplied, returns only traces document of analysis run for a given traceId ( only one stage at the job pipeline)"
      )
      @QueryParam("traceId") @DefaultValue("") String traceId)
          {
           return traceService.routeAllEndpointToServiceMethod(jobId, traceId);
  }


  @DELETE
  @Path("/{jobId}")
  @Operation(
    summary = "Delete all traces and spans data of a certain jobId",
    description = "Deletes a specific job traces and spans by jobId and optional traceId ( to delete only one agent stage spans")
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
      description = "job id to delete its traces (unique scan_id identifier of the analysis run)",
      required = true
    )
    @PathParam("jobId") @NotEmpty String jobId,
    @Parameter(description = "If supplied, trace_id to delete only spans of one agent/llm stage")
    @QueryParam("traceId") String traceId)
    {
     traceService.removeByJobAndTrace(jobId, traceId);
     return Response.accepted().build();
  }

}
