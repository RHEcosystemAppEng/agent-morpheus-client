/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.redhat.ecosystemappeng.morpheus.service;

import jakarta.ws.rs.core.SecurityContext;

import java.util.Objects;

public class UtilitiesService {

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
}
