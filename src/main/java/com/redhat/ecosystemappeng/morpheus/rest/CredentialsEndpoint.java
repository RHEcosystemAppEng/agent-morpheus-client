package com.redhat.ecosystemappeng.morpheus.rest;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SecuritySchemeType;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.security.SecurityRequirement;
import org.eclipse.microprofile.openapi.annotations.security.SecurityScheme;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.model.ErrorResponse;
import com.redhat.ecosystemappeng.morpheus.service.CredentialStoreService;
import com.redhat.ecosystemappeng.morpheus.service.CredentialStorageException;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;
import jakarta.ws.rs.core.SecurityContext;

/**
 * REST endpoint for credential retrieval by ExploitIQ Agent.
 * Provides secure, single-use access to stored credentials for private repository access.
 */
@SecurityScheme(
    securitySchemeName = "jwt",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "jwt"
)
@SecurityRequirement(name = "jwt")
@Path("credentials")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "credentials", description = "Credential retrieval operations for Agent callback")
public class CredentialsEndpoint {

    private static final Logger LOGGER = Logger.getLogger(CredentialsEndpoint.class);

    @Inject
    CredentialStoreService credentialStoreService;

    /**
     * Retrieves a stored credential for ExploitIQ Agent use (single-use).
     *
     * This endpoint is called by the ExploitIQ Agent to fetch
     * credentials for private repository access. The credential is decrypted and
     * returned in plaintext, then immediately deleted from storage.
     *
     * @param userId user identifier from original request (must match JWT in production)
     * @param credentialId unique credential identifier (UUID)
     * @param securityContext JWT security context for authentication
     * @return 200 OK with CredentialData (secretValue, username, type) or error response
     */
    @GET
    @Path("/{credentialId}")
    @Operation(
        summary = "Retrieve credential for ExploitIQ Agent",
        description = "Single-use retrieval of decrypted credential. Credential is deleted after retrieval."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Credential retrieved successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = CredentialStoreService.CredentialData.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid credentialId format"
        ),
        @APIResponse(
            responseCode = "401",
            description = "Authentication required (missing or invalid JWT)"
        ),
        @APIResponse(
            responseCode = "404",
            description = "Credential not found or expired"
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public Response retrieveCredential(
            @PathParam("credentialId") String credentialId,
            @Context SecurityContext securityContext) {

        if (credentialId == null || credentialId.isBlank()) {
            LOGGER.warnf("Invalid credentialId parameter: blank or null");
            return Response.status(Status.BAD_REQUEST)
                .entity(new ErrorResponse("credentialId is required"))
                .build();
        }

        // JWT authentication check
        if (securityContext.getUserPrincipal() == null) {
            LOGGER.warnf("Unauthenticated credential retrieval attempt: credentialId=%s",
                credentialId);
            return Response.status(Status.UNAUTHORIZED)
                .entity(new ErrorResponse("Authentication required"))
                .build();
        }

        String jwtUserId = securityContext.getUserPrincipal().getName();
        LOGGER.infof("Agent credential retrieval request: credentialId=%s, agent=%s",
            credentialId, jwtUserId);

        try {
            CredentialStoreService.CredentialData credential =
                credentialStoreService.retrieve(credentialId);

            LOGGER.infof("Credential retrieved successfully: credentialId=%s, owner=%s, type=%s, agent=%s",
                credentialId, credential.userId(), credential.credentialType(), jwtUserId);

            return Response.ok(credential).build();

        } catch (IllegalArgumentException e) {
            LOGGER.warnf(e, "Invalid credential retrieval parameters: credentialId=%s",
                credentialId);
            return Response.status(Status.BAD_REQUEST)
                .entity(new ErrorResponse(e.getMessage()))
                .build();

        } catch (jakarta.ws.rs.NotFoundException e) {
            LOGGER.warnf("Credential not found or expired: credentialId=%s",
                credentialId);
            return Response.status(Status.NOT_FOUND)
                .entity(new ErrorResponse("Credential not found or expired"))
                .build();

        } catch (CredentialStorageException e) {
            LOGGER.errorf(e, "Failed to retrieve credential: credentialId=%s",
                credentialId);
            return Response.status(Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Failed to retrieve credential: " + e.getMessage()))
                .build();

        } catch (Exception e) {
            LOGGER.errorf(e, "Unexpected error retrieving credential: credentialId=%s",
                credentialId);
            return Response.status(Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Internal server error"))
                .build();
        }
    }
}
