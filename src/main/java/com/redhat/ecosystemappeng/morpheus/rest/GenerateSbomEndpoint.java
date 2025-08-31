package com.redhat.ecosystemappeng.morpheus.rest;

import java.io.IOException;
import java.util.Objects;

import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.redhat.ecosystemappeng.morpheus.service.GenerateSbomService;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;

@Path("/generate-sbom")
@Consumes(MediaType.TEXT_PLAIN)
@Produces(MediaType.APPLICATION_JSON)
public class GenerateSbomEndpoint {
    
    private static final Logger LOGGER = Logger.getLogger(GenerateSbomEndpoint.class);
    
    @Inject
    ObjectMapper objectMapper;

    @Inject
    GenerateSbomService generateSbomService;

    @POST
    public Response generateSbom(String image) {
        if (Objects.isNull(image) || image.isEmpty()) {
            return Response.status(Status.BAD_REQUEST)
                .entity(objectMapper.createObjectNode()
                .put("error", "Image has not been provided"))
                .build();
        }

        try {
            JsonNode sbom = generateSbomService.generate(image);
            return Response.ok(sbom).build();
        } catch (Exception e) {
            LOGGER.error("GenerateSbomService Failed", e);
            return Response.status(Status.INTERNAL_SERVER_ERROR)
                .entity(objectMapper.createObjectNode()
                .put("error", e.getMessage()))
                .build();
        }
    }
}