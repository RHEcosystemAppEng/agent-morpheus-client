package com.redhat.ecosystemappeng.morpheus.model.morpheus;

import com.fasterxml.jackson.annotation.JsonValue;

public enum SbomInfoType {
  MANUAL ("manual"),
  CYCLONEDX_JSON ("cyclonedx+json");

  @JsonValue
  final String name;

  SbomInfoType(String name) {
    this.name = name;
  }

  @Override
  public String toString() {
    return name;
  }
}
