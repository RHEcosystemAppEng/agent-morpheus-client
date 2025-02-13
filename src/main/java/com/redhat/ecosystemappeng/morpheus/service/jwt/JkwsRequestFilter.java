package com.redhat.ecosystemappeng.morpheus.service.jwt;

import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import io.quarkus.arc.Unremovable;
import io.quarkus.oidc.common.OidcEndpoint;
import io.quarkus.oidc.common.OidcRequestFilter;
import io.quarkus.oidc.common.OidcEndpoint.Type;
import io.vertx.core.http.HttpMethod;

@ApplicationScoped
@OidcEndpoint(value = Type.JWKS)
@Unremovable
public class JkwsRequestFilter implements OidcRequestFilter {

  @ConfigProperty(name = "openshift.serviceaccount.token")
  Optional<String> serviceAccountToken;

  @Override
  public void filter(OidcRequestContext requestContext) {
    HttpMethod method = requestContext.request().method();
    String uri = requestContext.request().uri();
    if (method == HttpMethod.GET && uri.endsWith("/jwks") && serviceAccountToken.isPresent()) {
      requestContext.request().bearerTokenAuthentication(serviceAccountToken.get());
    }
  }

}