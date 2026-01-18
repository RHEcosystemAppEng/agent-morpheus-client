package com.redhat.ecosystemappeng.morpheus.rest;

import java.util.Objects;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.media.ExampleObject;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
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

@SecurityRequirement(name = "jwt")
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
    @Operation(
        summary = "Generate SBOM", 
        description = "Generates a Software Bill of Materials (SBOM) for a container image")
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "SBOM generated successfully",
            content = @Content(
                schema = @Schema(type = SchemaType.OBJECT),
                examples = @ExampleObject(
                    name = "CycloneDX SBOM",
                    value = """
                    {
                    "$schema": "http://cyclonedx.org/schema/bom-1.6.schema.json",
                    "bomFormat": "CycloneDX",
                    "specVersion": "1.6",
                    "serialNumber": "generated UUID",
                    "version": 1,
                    "metadata": {
                        "timestamp": "current timestamp",
                        "tools": [],
                        "component": {},
                        "properties": []
                    },
                    "components": [],
                    "dependencies": []
                    }
                    """
                )
            )
        ),
        @APIResponse(
            responseCode = "400", 
            description = "Image has not been provided"
        ),
        @APIResponse(
            responseCode = "500", 
            description = "Internal server error"
        )
    })
    public Response generateSbom(
        @RequestBody(
            description = "Container image name and tag", 
            required = true,
            content = @Content(
                mediaType = MediaType.TEXT_PLAIN,
                schema = @Schema(type = SchemaType.STRING),
                examples = @ExampleObject(
                    name = "nginx:latest",
                    value = "nginx:latest"
                )
            )
        )
        String image) {
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
