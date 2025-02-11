package com.redhat.ecosystemappeng.morpheus.rest;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.Response.Status;

import java.net.URI;
import java.time.Instant;
import java.util.Date;

import io.quarkus.oidc.UserInfo;
import io.quarkus.security.Authenticated;
import io.quarkus.security.UnauthorizedException;
import io.quarkus.security.identity.CurrentIdentityAssociation;

@Path("/user")
@Authenticated
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
    if (identity.getIdentity().isAnonymous()) {
      throw new UnauthorizedException("Not authenticated");
    }

    final NewCookie removeCookie = new NewCookie.Builder("q_session")
        .maxAge(0)
        .expiry(Date.from(Instant.EPOCH))
        .path("/")
        .build();
    return Response.status(Status.SEE_OTHER).cookie(removeCookie).location(URI.create("/app")).build();
  }
}