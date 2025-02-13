package com.redhat.ecosystemappeng.morpheus.service.jwt;

import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import org.jboss.logging.Logger;

import io.quarkus.arc.Unremovable;
import io.quarkus.oidc.common.OidcEndpoint;
import io.quarkus.oidc.common.OidcRequestFilter;
import io.quarkus.oidc.common.OidcEndpoint.Type;
import io.vertx.core.http.HttpMethod;

@ApplicationScoped
@OidcEndpoint(value = Type.JWKS)
@Unremovable
public class JkwsRequestFilter implements OidcRequestFilter {

  private static final Logger LOGGER = Logger.getLogger(JkwsRequestFilter.class);

  private static final Path SA_TOKEN_PATH = Path.of("/var/run/secrets/kubernetes.io/serviceaccount/token");
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
    HttpMethod method = requestContext.request().method();
    String uri = requestContext.request().uri();
    if (method == HttpMethod.GET && uri.endsWith("/jwks") && token.isPresent()) {
      requestContext.request().bearerTokenAuthentication(token.get());
    }
  }

}