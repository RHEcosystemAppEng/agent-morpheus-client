package com.redhat.ecosystemappeng.morpheus.rest;

import java.io.IOException;
import java.util.Collection;

import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.model.Report;
import com.redhat.ecosystemappeng.morpheus.service.ReportService;

import jakarta.inject.Inject;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.ServerErrorException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;

@Path("/reports")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ReportEndpoint {

  private static final Logger LOGGER = Logger.getLogger(ReportEndpoint.class);

  @Inject
  ReportService reportService;
  
  @POST
  public Response receive(String report) {
    try {
			reportService.save(report);
		} catch (IOException e) {
			LOGGER.warn("Unable to process received report", e);
		}
    return Response.ok().build();
  }

  @GET
  public Collection<Report> list() {
    return reportService.list();
  }

  @GET
  @Path("/{id}")
  public String get(@PathParam("id") String id) throws InterruptedException {
    try {
      var report = reportService.get(id);
      if(report == null) {
        throw new NotFoundException(id);
      }
      Thread.sleep(10000);
      return report;
    } catch (IOException e) {
      throw new ServerErrorException("Unable to retrieve requested Report with id " + id, Status.INTERNAL_SERVER_ERROR);
    }
  }

  @DELETE
  @Path("/{id}")
  public Response remove(@PathParam("id") String id) {
    try {
      reportService.remove(id);
      return Response.accepted().build();
    } catch (IOException e) {
      throw new ServerErrorException("Unable to remove requested Report with id " + id, Status.INTERNAL_SERVER_ERROR);
    }
  }
}
