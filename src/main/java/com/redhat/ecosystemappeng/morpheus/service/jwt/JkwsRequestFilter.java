package com.redhat.ecosystemappeng.morpheus.service.jwt;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import io.quarkus.arc.Unremovable;
import io.quarkus.oidc.common.OidcEndpoint;
import io.quarkus.oidc.common.OidcEndpoint.Type;
import io.quarkus.oidc.common.OidcRequestFilter;
import io.vertx.core.http.HttpMethod;

/**
 * OIDC request filter that adds ServiceAccount token to JWKS requests.
 * Only active when discovery-enabled=false (prod profile with OpenShift OAuth).
 * When using external-idp/dev profiles with discovery-enabled=true, this filter is skipped.
 */
@ApplicationScoped
@OidcEndpoint(value = Type.JWKS)
@Unremovable
public class JkwsRequestFilter implements OidcRequestFilter {

  private static final Logger LOGGER = Logger.getLogger(JkwsRequestFilter.class);
  private static final Path SA_TOKEN_PATH = Path.of("/var/run/secrets/kubernetes.io/serviceaccount/token");

  @ConfigProperty(name = "quarkus.oidc.discovery-enabled", defaultValue = "true")
  boolean discoveryEnabled;

  Optional<String> token = Optional.empty();

  @PostConstruct
  void loadToken() {
    if (Files.exists(SA_TOKEN_PATH)) {
      try {
        token = Optional.of(Files.readString(SA_TOKEN_PATH));
      } catch (IOException e) {
        LOGGER.errorf("Unable to read Service Account Token: %s", SA_TOKEN_PATH.toString(), e);
      }
    }
  }

  @Override
  public void filter(OidcRequestContext requestContext) {
    // Skip if OIDC discovery is enabled (external-idp/dev profiles)
    // Only apply for prod profile where discovery-enabled=false
    if (discoveryEnabled) {
      LOGGER.debugf("JkwsRequestFilter: skipping (discovery-enabled=%s)", discoveryEnabled);
      return;
    }

    HttpMethod method = requestContext.request().method();
    String uri = requestContext.request().uri();
    LOGGER.debugf("JkwsRequestFilter: processing request %s %s", method, uri);
    if (method == HttpMethod.GET && uri.endsWith("/jwks") && token.isPresent()) {
      LOGGER.debug("JkwsRequestFilter: adding SA token to JWKS request");
      requestContext.request().bearerTokenAuthentication(token.get());
    }
  }
}
