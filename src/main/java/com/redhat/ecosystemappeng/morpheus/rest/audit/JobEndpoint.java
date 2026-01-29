package com.redhat.ecosystemappeng.morpheus.rest.audit;

import com.redhat.ecosystemappeng.morpheus.model.*;
import com.redhat.ecosystemappeng.morpheus.model.audit.Job;
import com.redhat.ecosystemappeng.morpheus.service.audit.JobService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
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


@SecurityScheme(securitySchemeName = "jwt", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "jwt", description = "Please enter your JWT Token without Bearer")
@SecurityRequirement(name = "jwt")
@Path("/jobs")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class JobEndpoint extends BaseAuditEndpoint {

  private static final Logger LOGGER = Logger.getLogger(JobEndpoint.class);

  @Inject
  JobService jobService;

  @Context
  UriInfo info;

  @POST
  @Operation(
    summary = "Create List of new jobs containing metadata of executions of analysis",
    description = "Creates multiple jobs containing audit metadata about analysis runs")
  @APIResponses({
    @APIResponse(
      responseCode = "202",
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
      description = "Request body of job analysis run metadata",
      required = true,
      schema = @Schema(type = SchemaType.ARRAY, implementation = Job.class)
    )
    @RequestBody(
      description = "Job Analysis run metadata",
      required = true)
    @Valid
     List<Job> jobs) {

        jobService.saveMany(jobs);
        return Response.accepted().build();
  }

  @POST
  @Path("/one")
  @Operation(
    summary = "Create one job containing metadata of one execution of analysis",
    description = "Creates 1 jobs audit data")
  @APIResponses({
    @APIResponse(
      responseCode = "201",
      description = "job creation succeeded"
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
      description = "Job Analysis run metadata")
      @Valid
      Job job) {

        jobService.save(job);
        return Response.created(URI.create(String.format("%s%s/?jobId=%s", this.info.getBaseUri().toString(), this.info.getPathSegments().getFirst() , job.getJobId()))).build();
  }


  @GET
  @Path("/all")
  @Operation(
    summary = "Get jobs documents containing metadata of analysis runs ",
    description = "Retrieves a list of audit metadata jobs documents " +
            "by several filtering combinations, by batchId, by cveId," +
            " by cveId, componentName, componentVersion " +
            "or all documents if none of the query-parameters are supplied")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Jobs retrieved successfully",
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
      description = "Internal server error"
    )
  })
  public List<Job> list(
      @Parameter(
        description = "if supplied, fetch jobs documents of the given batchId'"
      )
      @QueryParam("batchId") @DefaultValue("") String batchId,
      @Parameter(
        description = "If supplied, fetch jobs documents of analysis runs of the given vulnerability"
      )
      @QueryParam("cveId") @DefaultValue("") String cveId,
      @Parameter(
        description = "If supplied, return jobs with the given Application name or project name which is inspected in the analysis run"
      )
      @QueryParam("component") @DefaultValue("") String component,

      @Parameter(
              description = "If supplied, return jobs with the given Application version which is  inspected in the analysis run"
      )
      @QueryParam("componentVersion") @DefaultValue("") String componentVersion)

          {
           return jobService.routeAllEndpointToServiceMethod(batchId, cveId, component, componentVersion);
  }

  @GET
  @Path("/{id}")
  @Operation(
    summary = "Get job run data",
    description = "Retrieves a specific job run data by internal DB Id")
  @APIResponses({
    @APIResponse(
      responseCode = "200", 
      description = "Job retrieved successfully",
      content = @Content(
        schema = @Schema(
          type = SchemaType.OBJECT,
          implementation = Job.class
          )
      )
    ),
    @APIResponse(
      responseCode = "404", 
      description = "Job not found"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Job get(
    @Parameter(
      description = "Job ID to get (24-character hexadecimal MongoDB ObjectId format)",
      required = true
    )
    @PathParam("id") String id)  {
      return jobService.getById(id);
  }

  @GET
  @Operation(
    summary = "Get job run data by jobId",
    description = "Retrieves a specific job run metadata by job identifier(scan_id)")
  @APIResponses({
    @APIResponse(
      responseCode = "200",
      description = "Job retrieved successfully",
      content = @Content(
        schema = @Schema(
          type = SchemaType.OBJECT,
          implementation = Job.class
          )
      )
    ),
    @APIResponse(
      responseCode = "404",
      description = "Job not found"
    ),
    @APIResponse(
      responseCode = "500",
      description = "Internal server error"
    )
  })
  public Job getByJobId(
    @Parameter(
      description = "Job ID to get (unique id (scan_id) of the job to be fetched )",
      required = true
    )
    @QueryParam("jobId") String jobId)  {

      return jobService.getByJobId(jobId);
  }



  @DELETE
  @Path("/{id}")
  @Operation(
    summary = "Delete analysis job metadata",
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
      description = "job id to delete (unique scan_id identifier of the analysis run)",
      required = true
    )
    @PathParam("id") String id) {
     jobService.removeByJobId(id);
     return Response.accepted().build();
  }

  @DELETE
  @Operation(
    summary = "Delete multiple analysis reports", 
    description = "Deletes multiple analysis job runs metadata by job ids")
  @APIResponses({
    @APIResponse(
      responseCode = "202", 
      description = "Reports deletion request accepted"
    ),
    @APIResponse(
      responseCode = "500", 
      description = "Internal server error"
    )
  })
  public Response removeMany(
    @Parameter(
      description = "List of report IDs to delete (24-character hexadecimal MongoDB ObjectId format)"
    )
    @QueryParam("jobsIds") List<String> jobsIds) {
      jobService.removeManyJobsIds(jobsIds);
      return Response.accepted().build();
  }



}
