package com.redhat.ecosystemappeng.morpheus.client;


import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import jakarta.ws.rs.POST;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.concurrent.CompletionStage;

@RegisterRestClient(configKey = "morpheus")
@Produces(MediaType.APPLICATION_JSON)
public interface MorpheusService {
  
  @POST
  CompletionStage<Response> submitAsync(String request);
}
