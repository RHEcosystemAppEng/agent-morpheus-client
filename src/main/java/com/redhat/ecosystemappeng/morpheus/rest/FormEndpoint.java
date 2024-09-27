package com.redhat.ecosystemappeng.morpheus.rest;

import java.util.Collections;
import java.util.Set;

import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.client.GitHubService;
import com.redhat.ecosystemappeng.morpheus.client.MorpheusService;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/form")
@Produces(MediaType.APPLICATION_JSON)
public class FormEndpoint {

  private static final Logger LOGGER = Logger.getLogger(FormEndpoint.class);
  
  @RestClient
  GitHubService gitHubService;

  @RestClient
  MorpheusService morpheusService;

  @GET
  @Path("/git-languages")
  public Set<String> getGitLanguages(@QueryParam("repository") String repository) {
    try {
      LOGGER.debugf("looking for programming languages for repository %s", repository);
      return gitHubService.getLanguages(repository).keySet();
    } catch (Exception e) {
      LOGGER.infof(e, "Unable to retrieve languages for repository %s", repository);
      return Collections.emptySet();
    }
  }

  @POST
  @Consumes(MediaType.APPLICATION_JSON)
  public Response submitRequest(String request) {
    LOGGER.infof("Received request", request);
    try {
    return morpheusService.submit(request);
    } catch (WebApplicationException e) {
      return e.getResponse();
    }
  }
}
