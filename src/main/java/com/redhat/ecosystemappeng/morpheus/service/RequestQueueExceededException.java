package com.redhat.ecosystemappeng.morpheus.service;

public class RequestQueueExceededException extends RuntimeException {

  public RequestQueueExceededException(Integer maxSize) {
    super("Exceeded request queue size: " + maxSize);
  }
  
}
