package com.redhat.ecosystemappeng.morpheus.model;

import java.util.List;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record SortField(String field, SortType type) {

  public static List<SortField> fromSortBy(List<String> sortBy) {
    if (sortBy == null) {
      return null;
    }
    return sortBy.stream()
        .map(s -> s.split(":"))
        .map(v -> new SortField(v[0], SortType.valueOf(v[1].toUpperCase())))
        .toList();
  }
}
