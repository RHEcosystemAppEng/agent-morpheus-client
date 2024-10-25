package com.redhat.ecosystemappeng.morpheus.model;

import java.util.stream.Stream;

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
