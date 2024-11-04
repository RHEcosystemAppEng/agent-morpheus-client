package com.redhat.ecosystemappeng.morpheus.rest;

import java.io.IOException;
import java.util.List;

import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.model.Pagination;
import com.redhat.ecosystemappeng.morpheus.model.ReportReceivedEvent;
import com.redhat.ecosystemappeng.morpheus.model.SortField;
import com.redhat.ecosystemappeng.morpheus.service.ReportRepositoryService;

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
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/reports")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ReportEndpoint {

  private static final Logger LOGGER = Logger.getLogger(ReportEndpoint.class);

  @Inject
  NotificationSocket notificationSocket;

  @Inject
  ReportRepositoryService repository;

  @Inject
  ObjectMapper mapper;

  @POST
  public Response receive(String report) {
    ReportReceivedEvent event = null;
    try {
      var r = repository.save(report);
      LOGGER.infof("Received report %s", r.id());
      event = new ReportReceivedEvent(r.id(), r.name(), "Created");
      notificationSocket.onMessage(mapper.writeValueAsString(event));
    } catch (IOException e) {
      LOGGER.warn("Unable to process received report", e);
      event = new ReportReceivedEvent(null, null, e.getMessage());
    }
    return Response.accepted(event).build();
  }

  @GET
  public Response list(
      @QueryParam("vulnId") String vulnId,
      @QueryParam("sortBy") @DefaultValue("completedAt:DESC") List<String> sortBy,
      @QueryParam("page") @DefaultValue("0") Integer page,
      @QueryParam("pageSize") @DefaultValue("1000") Integer pageSize) {

    var result = repository.list(vulnId, SortField.fromSortBy(sortBy),
        new Pagination(page, pageSize));
    return Response.ok(result.results)
        .header("X-Total-Pages", result.totalPages)
        .header("X-Total-Elements", result.totalElements)
        .build();
  }

  @GET
  @Path("/{id}")
  public String get(@PathParam("id") String id) throws InterruptedException {
    var report = repository.findById(id);
    if (report == null) {
      throw new NotFoundException(id);
    }
    return report;
  }

  @DELETE
  @Path("/{id}")
  public Response remove(@PathParam("id") String id) {
    if (repository.remove(id)) {
      return Response.accepted().build();
    }
    return Response.serverError().build();
  }
}
