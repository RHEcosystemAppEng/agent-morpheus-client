package com.redhat.ecosystemappeng.morpheus.rest;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SecuritySchemeType;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.security.SecurityScheme;

import com.redhat.ecosystemappeng.morpheus.model.ReportSseMessage;
import com.redhat.ecosystemappeng.morpheus.service.ReportSseBroadcaster;

import io.smallrye.mutiny.Multi;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.jboss.resteasy.reactive.RestStreamElementType;

@SecurityScheme(securitySchemeName = "jwt", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT", description = "Please enter your JWT Token without Bearer")
@SecurityRequirement(name = "jwt")
@Path("/reports")
public class ReportStreamResource {

  @Inject
  ReportSseBroadcaster broadcaster;

  @GET
  @Path("/stream")
  @Produces(MediaType.SERVER_SENT_EVENTS)
  @RestStreamElementType(MediaType.APPLICATION_JSON)
  @Operation(summary = "Report catalog change stream", description = "Server-Sent Events (JSON). Emit `catalog` when reports or products change; clients should refetch their REST views.")
  @APIResponses({
      @APIResponse(responseCode = "200", description = "SSE stream", content = @Content(schema = @Schema(implementation = ReportSseMessage.class)))
  })
  public Multi<ReportSseMessage> stream() {
    return broadcaster.subscribe();
  }
}
