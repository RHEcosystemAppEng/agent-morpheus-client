package com.redhat.ecosystemappeng.morpheus.rest.audit;

import com.redhat.ecosystemappeng.morpheus.model.audit.Eval;
import com.redhat.ecosystemappeng.morpheus.service.audit.EvalService;
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
import org.jboss.logging.Logger;

import java.util.List;

import static com.redhat.ecosystemappeng.morpheus.service.audit.AuditService.REGEX_PATTERN_FOR_CVE;


@SecurityScheme(securitySchemeName = "jwt", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "jwt", description = "Please enter your JWT Token without Bearer")
@SecurityRequirement(name = "jwt")
@Path("/evals")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class EvalEndpoint extends BaseAuditEndpoint {

  private static final Logger LOGGER = Logger.getLogger(EvalEndpoint.class);

  @Inject
  EvalService evalService;

  @POST
  @Operation(
    summary = "Create List of new jobs containing metadata of executions of analysis",
    description = "Creates multiple jobs containing audit metadata about analysis runs")
  @APIResponses({
    @APIResponse(
      responseCode = "201",
      description = "jobs creation accepted"
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
  public Response saveMany(
    @Parameter(
      description = "Request body of many Evaluation Metrics data, each one  of a certain LLM Stage in the pipeline run",
      required = true,
      schema = @Schema(type = SchemaType.ARRAY, implementation = Eval.class)
    )
    @RequestBody(
      description = "Eval Metric data of a certain LLM Stage of single Analysis run",
      required = true)
    @Valid
     List<Eval> evals) {

//        evalService.saveMany(evals);
//        return Response.accepted().build();
      return null;
  }


  @GET
  @Path("/all")
  @Operation(
    summary = "Get eval metrics data documents containing metrics score of llm stages in  ",
    description = "Retrieves a list of eval metrics documents with data and scores of llm stages in jobs runs " +
            "by several filtering combinations, by jobId, by traceId," +
            "or all eval documents if none of the query-parameters are supplied")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Evals retrieved successfully",
      content = @Content(
        schema = @Schema(type = SchemaType.ARRAY, implementation = Eval.class)
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
  public List<Eval> list(
      @Parameter(
        description = "If supplied , fetch eval metrics documents of analysis runs of the given jobId"
      )
      @QueryParam("jobId") @DefaultValue("") String jobId,
      @Parameter(
        description = "If supplied, returns only eval metrics of analysis run for a given traceId ( only one stage at the job pipeline)"
      )
      @QueryParam("traceId") @DefaultValue("") String traceId)
          {
           return evalService.routeAllEndpointToServiceMethod(jobId, traceId);
  }

@GET
  @Path("/{cveId}")
  @Operation(
    summary = "Get all eval metrics data documents containing metrics score of all jobs runs " +
            "and all their llm stages for a given application version and vulnerability combination ",
    description = "Retrieves a list of audit metadata jobs documents " +
            "by several filtering combinations, by jobId, by traceId," +
            "or all documents if none of the query-parameters are supplied")
  @APIResponses({
    @APIResponse(
      responseCode = "200",
      description = "Jobs retrieved successfully",
      content = @Content(
        schema = @Schema(type = SchemaType.ARRAY, implementation = Eval.class)
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
  public List<Eval> listAppAndCveEvals(
      @Parameter(
        description = "If supplied, return all  with the given Application name or project name which is inspected in the analysis run",
        required = true
      )
      @QueryParam("component") @DefaultValue("") @Valid @NotEmpty String component,

      @Parameter(
              description = "If supplied, return jobs with the given Application version which is  inspected in the analysis run",
              required = true

      )
      @QueryParam("componentVersion") @Valid @NotEmpty @DefaultValue("") String componentVersion,

      @Parameter(description = "If supplied, return only evals data documents of the specific metric name")
      @QueryParam("metricName") @DefaultValue("") String metricName,


      @PathParam("cveId") @Valid @NotEmpty @Pattern(regexp = REGEX_PATTERN_FOR_CVE) String cveId)

          {
           return evalService.getCveAndApplicationEvals(cveId, component, componentVersion, metricName);
  }


  @DELETE
  @Path("/{jobId}")
  @Operation(
    summary = "Delete all eval metrics data of a certain jobId, or metadata",
    description = "Deletes a specific analysis job metadata by Internal DB id")
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
      description = "job id to delete its evals (unique scan_id identifier of the analysis run)",
      required = true
    )
    @PathParam("jobId") @NotEmpty String jobId,
    @Parameter(description = "If supplied, trace_id to delete only metrics of one llm stage")
    @QueryParam("traceId") String traceId)
    {
     evalService.removeByJobAndTrace(jobId, traceId);
     return Response.accepted().build();
  }

}
