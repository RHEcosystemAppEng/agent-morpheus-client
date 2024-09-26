package com.redhat.ecosystemappeng.morpheus.rest;

import java.util.Collections;
import java.util.Set;

import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.client.GitHubService;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;

@Path("/form")
public class FormEndpoint {

  private static final Logger LOGGER = Logger.getLogger(FormEndpoint.class);
  
  @RestClient
  GitHubService gitHubService;

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
}
