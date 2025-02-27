package com.redhat.ecosystemappeng.morpheus.service;

import io.quarkus.oidc.UserInfo;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class UserService {
  
  @Inject
  UserInfo userInfo;

  private static final String DEFAULT_USERNAME = "anonymous";

  public String getUserName() {
    if(userInfo != null) {
      var name = userInfo.getString("upn");
      if(name != null) {
        return name;
      }
      var metadata = userInfo.getObject("metadata");
      if(metadata != null) {
        name = metadata.getString("name");
        if(name != null) {
          return name;
        }
      }
    } 
    return DEFAULT_USERNAME;
  }
}
