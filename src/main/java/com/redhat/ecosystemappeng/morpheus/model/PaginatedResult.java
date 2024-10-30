package com.redhat.ecosystemappeng.morpheus.model;

import java.util.stream.Stream;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public class PaginatedResult<T> {

  public final long totalElements;
  public final long totalPages;
  public final Stream<T> results;

  public PaginatedResult(long totalElements, long totalPages, Stream<T> results) {
    this.results = results;
    this.totalElements = totalElements;
    this.totalPages = totalPages;
  }
}
