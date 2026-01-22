package com.redhat.ecosystemappeng.morpheus.service;

import io.quarkus.oidc.UserInfo;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import java.util.Objects;

@ApplicationScoped
public class UserService {
  
  @Inject
  Instance<UserInfo> userInfoInstance;

  private static final String DEFAULT_USERNAME = "anonymous";

  public String getUserName() {
    if(userInfoInstance.isResolvable()) {
      var userInfo = userInfoInstance.get();
      // Try email first
      var name = userInfo.getString("email");
      if(Objects.nonNull(name)) {
        return name;
      }
      // Fallback to upn
      name = userInfo.getString("upn");
      if(Objects.nonNull(name)) {
        return name;
      }
      // Fallback to metadata.name
      var metadata = userInfo.getObject("metadata");
      if(Objects.nonNull(metadata)) {
        name = metadata.getString("name");
        if(Objects.nonNull(name)) {
          return name;
        }
      }
    } 
    return DEFAULT_USERNAME;
  }
}
