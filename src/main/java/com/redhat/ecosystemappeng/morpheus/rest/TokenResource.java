package com.redhat.ecosystemappeng.morpheus.rest;

import jakarta.annotation.security.PermitAll;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import org.eclipse.microprofile.openapi.annotations.Operation;
import com.redhat.ecosystemappeng.morpheus.service.UserService;

@Path("/user")
public class TokenResource {

    @Inject
    UserService userService;

    @GET
    @Produces("application/json")
    @Operation(hidden = true)
    public String getUserName() {
        return String.format("{\"name\": \"%s\"}", userService.getUserName());
    }

    /**
     * Performs a local logout using the standard 'Clear-Site-Data' header.
     * This feature is available only in secure contexts (HTTPS)
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Clear-Site-Data
     */
    @POST
    @Path("/logout")
    @Produces(MediaType.TEXT_HTML)
    @Operation(hidden = true)
    @PermitAll
    public Response logout() {
        return Response.ok(LOGGED_OUT_HTML)
                .header("Clear-Site-Data", "\"cookies\", \"storage\"")
                .build();
    }

    private static final String LOGGED_OUT_HTML = """
            <!DOCTYPE html>
            <html lang="en" class="pf-v6-u-h-100">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Logged Out - ExploitIQ</title>
                <link rel="stylesheet" href="https://unpkg.com/@patternfly/patternfly@6.1.0/patternfly.css" crossorigin="anonymous">
            </head>
            <body class="pf-v6-u-h-100 pf-v6-u-m-0 pf-v6-u-background-color-200">
                <div class="pf-v6-l-bullseye pf-v6-u-h-100">
                    <div class="pf-v6-c-empty-state pf-m-lg pf-m-success">
                        <div class="pf-v6-c-empty-state__content">
                            <div class="pf-v6-c-empty-state__icon">
                                <svg fill="currentColor" height="1em" width="1em" viewBox="0 0 512 512" aria-hidden="true" role="img">
                                    <path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 48c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m140.204 130.267l-22.536-22.718c-4.667-4.705-12.265-4.736-16.97-.068L215.346 303.697l-59.792-60.277c-4.667-4.705-12.265-4.736-16.97-.069l-22.719 22.536c-4.705 4.667-4.736 12.265-.068 16.971l90.781 91.516c4.667 4.705 12.265 4.736 16.97.068l172.589-171.204c4.704-4.668 4.734-12.266.067-16.971z"/>
                                </svg>
                            </div>
                            <h1 class="pf-v6-c-empty-state__title-text">Successfully Logged Out</h1>
                            <div class="pf-v6-c-empty-state__body">
                                You have been logged out from ExploitIQ.
                            </div>
                            <div class="pf-v6-c-empty-state__footer">
                                <div class="pf-v6-c-empty-state__actions">
                                    <a href="/" class="pf-v6-c-button pf-m-primary pf-m-display-lg">Login Again</a>
                                </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </body>
              </html>
              """;
}
