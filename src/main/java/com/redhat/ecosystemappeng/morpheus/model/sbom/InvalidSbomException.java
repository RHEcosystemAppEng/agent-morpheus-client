package com.redhat.ecosystemappeng.morpheus.model.sbom;

public class InvalidSbomException extends IllegalArgumentException {
  
  public InvalidSbomException(String message, Throwable e) {
    super(message, e);
  }

}
