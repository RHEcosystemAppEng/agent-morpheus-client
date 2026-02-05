package com.redhat.ecosystemappeng.morpheus.security;

import io.quarkus.runtime.LaunchMode;
import io.quarkus.security.identity.AuthenticationRequestContext;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.security.identity.SecurityIdentityAugmentor;
import io.quarkus.security.runtime.QuarkusPrincipal;
import io.quarkus.security.runtime.QuarkusSecurityIdentity;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;

import jakarta.json.JsonArray;
import jakarta.json.JsonObject;
import jakarta.json.JsonString;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

import java.util.HashSet;
import java.util.Set;

/**
 * Security Augmentor to map external Identity Provider roles to internal
 * application roles.
 *
 * Different Identity Providers (OpenShift, Keycloak) store role information in
 * different JWT claims:
 * - OpenShift: 'groups'
 * - Keycloak: 'realm_access.roles' or 'resource_access.{client_id}.roles'
 *
 * This augmentor unifies role extraction logic to ensure consistent
 * authorization regardless of the IDP.
 * It also facilitates local development by allowing unauthenticated access in
 * DEV/TEST modes when OIDC is disabled.
 */
@ApplicationScoped
public class RoleMappingAugmentor implements SecurityIdentityAugmentor {

    private static final Logger LOG = Logger.getLogger(RoleMappingAugmentor.class);
    @ConfigProperty(name = "quarkus.oidc.client-id", defaultValue = "exploit-iq-client")
    String clientId;

    @ConfigProperty(name = "exploit-iq.security.target-roles", defaultValue = "exploit-iq-admin,exploit-iq-view,exploit-iq-prodsec")
    Set<String> targetRoles;

    @ConfigProperty(name = "quarkus.oidc.enabled", defaultValue = "true")
    boolean oidcEnabled;

    private boolean loggedDevModeWarning = false;

    /**
     * Augments the security identity.
     *
     * In DEV/TEST mode with OIDC disabled, it creates a mock privileged user.
     * Otherwise, it maps OIDC token claims to application roles.
     */
    @Override
    public Uni<SecurityIdentity> augment(SecurityIdentity identity, AuthenticationRequestContext context) {
        if (!oidcEnabled && (LaunchMode.current() == LaunchMode.DEVELOPMENT || LaunchMode.current() == LaunchMode.TEST)
                && identity.isAnonymous()) {
            if (!loggedDevModeWarning) {
                LOG.warnf("OIDC is disabled and in DEV/TEST mode. Granting anonymous user all target roles: %s",
                        targetRoles);
                loggedDevModeWarning = true;
            }
            return Uni.createFrom().item(QuarkusSecurityIdentity.builder()
                    .setPrincipal(new QuarkusPrincipal("anonymous"))
                    .addRoles(targetRoles)
                    .build());
        }

        if (identity.isAnonymous()) {
            return Uni.createFrom().item(identity);
        }

        return Uni.createFrom().item(identity)
                .map(this::augmentIdentity);
    }

    /**
     * Extracts roles from the JWT principal.
     *
     * Supports role extraction from OpenShift ('groups') and Keycloak
     * ('realm_access', 'resource_access') claims.
     */
    private SecurityIdentity augmentIdentity(SecurityIdentity identity) {
        if (identity.getPrincipal() instanceof JsonWebToken) {
            JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();
            QuarkusSecurityIdentity.Builder builder = QuarkusSecurityIdentity.builder(identity);
            Set<String> addedRoles = new HashSet<>();

            LOG.debugf("Augmenting identity for principal: %s", identity.getPrincipal().getName());

            checkClaimAndMapRoles(jwt.getClaim("groups"), "OpenShift Group", addedRoles, builder);

            Object realmAccessObj = jwt.getClaim("realm_access");
            if (realmAccessObj instanceof JsonObject) {
                JsonObject realmAccess = (JsonObject) realmAccessObj;
                if (realmAccess.containsKey("roles")) {
                    checkClaimAndMapRoles(realmAccess.getJsonArray("roles"), "Keycloak Realm Role", addedRoles,
                            builder);
                }
            }

            Object resourceAccessObj = jwt.getClaim("resource_access");
            if (resourceAccessObj instanceof JsonObject) {
                JsonObject resourceAccess = (JsonObject) resourceAccessObj;
                if (resourceAccess.containsKey(clientId)) {
                    JsonObject clientAccess = resourceAccess.getJsonObject(clientId);
                    if (clientAccess != null && clientAccess.containsKey("roles")) {
                        checkClaimAndMapRoles(clientAccess.getJsonArray("roles"), "Keycloak Client Role", addedRoles,
                                builder);
                    }
                }
            }
            return builder.build();
        }
        return identity;
    }

    private void checkClaimAndMapRoles(Object claimValue, String sourceName, Set<String> addedRoles,
            QuarkusSecurityIdentity.Builder builder) {
        if (claimValue == null) {
            return;
        }

        if (claimValue instanceof JsonArray) {
            ((JsonArray) claimValue).forEach(val -> {
                if (val instanceof JsonString) {
                    processRole(((JsonString) val).getString(), sourceName, addedRoles, builder);
                }
            });
        } else if (claimValue instanceof java.util.Collection) {
            ((java.util.Collection<?>) claimValue).forEach(val -> {
                processRole(val.toString(), sourceName, addedRoles, builder);
            });
        }
    }

    private void processRole(String roleName, String sourceName, Set<String> addedRoles,
            QuarkusSecurityIdentity.Builder builder) {
        if (targetRoles.contains(roleName)) {
            if (!addedRoles.contains(roleName)) {
                LOG.infof("Mapping user to role '%s' from source: %s", roleName, sourceName);
                builder.addRole(roleName);
                addedRoles.add(roleName);
            }
        }
    }
}
