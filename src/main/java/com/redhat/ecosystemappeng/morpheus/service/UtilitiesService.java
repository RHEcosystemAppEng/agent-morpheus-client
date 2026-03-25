package com.redhat.ecosystemappeng.morpheus.service;

import jakarta.ws.rs.core.SecurityContext;

import java.util.Objects;

public class UtilitiesService {

    public static final String TIMESTAMP_SUFFIX_UTC_NOTATION = "Z";
    /**
     *
     * @param securityContext of the rest api request, containing JWT with claims , including principal claims including name
     * @param userService of the logged-in user associated with the request context ( user details from oidc auth server' user-info endpoint)
     * @return If The user is service account, then get the principal name from the JWT, otherwise, if it's a logged in user, get it from UserService UserInfo data
     *   as the JWT of a human user doesn't contain principal name. Otherwise ( not authenticated), return null.
     */
    public static String getAuthenticatedUserName(SecurityContext securityContext, UserService userService) {
        if(Objects.nonNull(securityContext.getUserPrincipal().getName())) {
            return securityContext.getUserPrincipal().getName();
        }
        else {
            return Objects.nonNull(userService.getUserName()) ? userService.getUserName() : null;
        }
    }

    public static String getNonZonedTS(String ts) {
        if (ts.endsWith(TIMESTAMP_SUFFIX_UTC_NOTATION)) {
            return ts.substring(0, ts.length() - 1);
        }
        return ts;
    }
}
