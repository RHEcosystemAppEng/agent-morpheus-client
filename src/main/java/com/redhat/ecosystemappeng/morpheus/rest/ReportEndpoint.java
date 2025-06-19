package com.redhat.ecosystemappeng.morpheus.rest;

import java.util.List;
import java.util.Map.Entry;
import java.util.Set;
import java.util.stream.Collectors;

import com.redhat.ecosystemappeng.morpheus.tracing.TraceToMdc;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.ClientWebApplicationException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.ReportData;
import com.redhat.ecosystemappeng.morpheus.model.ReportRequest;
import com.redhat.ecosystemappeng.morpheus.model.SortField;
import com.redhat.ecosystemappeng.morpheus.service.ReportService;
import com.redhat.ecosystemappeng.morpheus.service.RequestQueueExceededException;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.ServerErrorException;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.core.Response.Status;

@Path("/reports")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ReportEndpoint {

  private static final Logger LOGGER = Logger.getLogger(ReportEndpoint.class);

  private static final String SORT_BY = "sortBy";
  private static final String PAGE = "page";
  private static final String PAGE_SIZE = "pageSize";

  private static final Set<String> FIXED_QUERY_PARAMS = Set.of(SORT_BY, PAGE, PAGE_SIZE);

  @Inject
  NotificationSocket notificationSocket;

  @Inject
  ReportService reportService;

  @Inject
  ObjectMapper objectMapper;

  @POST
  @Path("/new")
  public Response newRequest(@QueryParam("submit") @DefaultValue("true") boolean sendToMorpheus, ReportRequest request) {
    try {
      ReportData res = reportService.process(request);

      if (sendToMorpheus) {
        reportService.submit(res.reportRequestId().id(), res.report());
      }

      return Response.accepted(res).build();
    } catch (IllegalArgumentException e) {
      return Response.status(Status.BAD_REQUEST).entity(objectMapper.createObjectNode().put("error", e.getMessage()))
          .build();
    } catch (ClientWebApplicationException e) {
      return Response.status(e.getResponse().getStatus()).entity(e.getResponse().getEntity()).build();
    } catch (RequestQueueExceededException e) {
      return Response.status(Status.TOO_MANY_REQUESTS)
          .entity(objectMapper.createObjectNode().put("error", e.getMessage())).build();
    } catch (Exception e) {
      LOGGER.error("Unable to submit new analysis request", e);
      return Response.serverError().entity(objectMapper.createObjectNode().put("error", e.getMessage())).build();
    }
  }

  @POST
  @Path("/{id}/retry")
  public Response retry(@PathParam("id") String id) {
    try {
      if (reportService.retry(id)) {
        return Response.accepted(id).build();
      }
    } catch (JsonProcessingException e) {
      throw new ServerErrorException(Status.INTERNAL_SERVER_ERROR, e);
    }
    throw new NotFoundException(id);
  }

  @TraceToMdc
  @POST
  public Response receive(String report) {
    var reqId = reportService.receive(report);
    LOGGER.debugf("Received report { id: %s | report_id: %s }", reqId.id(), reqId.reportId());
    return Response.accepted(reqId).build();
  }

  @GET
  public Response list(
      @Context UriInfo uriInfo,
      @QueryParam(SORT_BY) @DefaultValue("submittedAt:DESC") List<String> sortBy,
      @QueryParam(PAGE) @DefaultValue("0") Integer page,
      @QueryParam(PAGE_SIZE) @DefaultValue("100") Integer pageSize) {

    var filter = uriInfo.getQueryParameters().entrySet().stream().filter(e -> !FIXED_QUERY_PARAMS.contains(e.getKey()))
        .collect(Collectors.toMap(Entry::getKey, e -> e.getValue().getFirst()));
    var result = reportService.list(filter, SortField.fromSortBy(sortBy), page, pageSize);
    return Response.ok(result.results)
        .header("X-Total-Pages", result.totalPages)
        .header("X-Total-Elements", result.totalElements)
        .build();
  }

  @GET
  @Path("/{id}")
  public String get(@PathParam("id") String id) throws InterruptedException {
    var report = reportService.get(id);
    if (report == null) {
      throw new NotFoundException(id);
    }
    return report;
  }

  @DELETE
  @Path("/{id}")
  public Response remove(@PathParam("id") String id) {
    if (reportService.remove(id)) {
      return Response.accepted().build();
    }
    return Response.serverError().build();
  }

  @DELETE
  public Response removeMany(@QueryParam("reportIds") List<String> reportIds, @Context UriInfo uriInfo) {
    if (reportIds.isEmpty()) {
      var filter = uriInfo.getQueryParameters().entrySet().stream()
          .filter(e -> !FIXED_QUERY_PARAMS.contains(e.getKey()))
          .collect(Collectors.toMap(Entry::getKey, e -> e.getValue().getFirst()));
      reportService.remove(filter);
    } else {
      reportService.remove(reportIds);
    }
    return Response.accepted().build();
  }
}
