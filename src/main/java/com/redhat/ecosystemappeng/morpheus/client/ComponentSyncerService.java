package com.redhat.ecosystemappeng.morpheus.client;


import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@RegisterRestClient(configKey = "component-syncer")
@Produces(MediaType.APPLICATION_JSON)
public interface ComponentSyncerService {
  
  @POST
  @Consumes("application/cloudevents+json")
  Response submit(JsonNode request);
}
