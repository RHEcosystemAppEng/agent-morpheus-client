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

import io.quarkus.arc.properties.IfBuildProperty;
import io.quarkus.oidc.UserInfo;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Inject;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import java.util.Objects;

@ApplicationScoped
public class UserService {

  @Inject
  UserInfo userInfo;

  private static final String DEFAULT_USERNAME = "anonymous";

  @IfBuildProperty(name = "quarkus.oidc.enabled", stringValue = "false")
  @ApplicationScoped
  @Produces
  public UserInfo getAnonymousUserInfo() {
    JsonObject json = Json.createObjectBuilder()
        .add("email", "anonymous")
        .build();
    return new UserInfo(json);
  }

  /**
   * Resolves the best available username from UserInfo claims.
   *
   * Checks explicitly for: email, upn, metadata.name, preferred_username, sub.
   * Falls back to "anonymous" if UserInfo is missing.
   */
  public String getUserName() {
    if (Objects.nonNull(userInfo)) {
      var name = userInfo.getString("email");
      if (Objects.nonNull(name)) {
        return name;
      }
      name = userInfo.getString("upn");
      if (Objects.nonNull(name)) {
        return name;
      }
      var metadata = userInfo.getObject("metadata");
      if (Objects.nonNull(metadata)) {
        name = metadata.getString("name");
        if (Objects.nonNull(name)) {
          return name;
        }
      }
      name = userInfo.getString("preferred_username");
      if (Objects.nonNull(name)) {
        return name;
      }
      name = userInfo.getString("sub");
      if (Objects.nonNull(name)) {
        return name;
      }
    }
    return DEFAULT_USERNAME;
  }
}
