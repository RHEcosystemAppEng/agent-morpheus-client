package com.redhat.ecosystemappeng.morpheus.rest;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;

import java.time.Instant;
import java.util.Date;

import io.quarkus.oidc.UserInfo;
import io.quarkus.security.identity.CurrentIdentityAssociation;

@Path("/user")
public class TokenResource {

  @Inject
  UserInfo userInfo;

  @Inject
  CurrentIdentityAssociation identity;

  @GET
  @Path("/info")
  @Produces("application/json")
  public String getUserInfo() {
    return userInfo.getUserInfoString();
  }

  @POST
  @Path("/logout")
  public Response logout() {
    final NewCookie removeCookie = new NewCookie.Builder("q_session")
        .maxAge(0)
        .expiry(Date.from(Instant.EPOCH))
        .path("/")
        .build();
    return Response.noContent().cookie(removeCookie).build();
  }
}