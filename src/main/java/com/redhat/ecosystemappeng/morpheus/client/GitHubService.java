package com.redhat.ecosystemappeng.morpheus.client;

import java.util.Map;

import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import jakarta.ws.rs.Encoded;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;

@RegisterRestClient(configKey = "github")
public interface GitHubService {

  @GET
  @Path("/repos/{repository}/languages")
  Map<String, Integer> getLanguages(@PathParam("repository") @Encoded String repository);

}
