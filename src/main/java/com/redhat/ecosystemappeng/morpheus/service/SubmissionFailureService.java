package com.redhat.ecosystemappeng.morpheus.service;

import java.util.List;

import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.model.FailedComponent;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class SubmissionFailureService {

  private static final Logger LOGGER = Logger.getLogger(SubmissionFailureService.class);
  
  @Inject
  SubmissionFailureRepositoryService repository;

  public void save(List<FailedComponent> request) {
    String productId = request.get(0).productId();
    LOGGER.debugf("Saving submission failures for product %s", productId);

    for (FailedComponent failure : request) {
      repository.save(productId, failure.imageName(), failure.imageVersion(), failure.error());
    }
  }

  public List<FailedComponent> get(String productId) {
    LOGGER.debugf("Getting submission failures for product %s", productId);
    return repository.get(productId);
  }

  public void remove(String productId) {
    LOGGER.debugf("Remove submission failures for product %s", productId);
    repository.remove(productId);
  }

  public void remove(List<String> productIds) {
    LOGGER.debugf("Remove submission failures for products %s", productIds.toString());
    repository.remove(productIds);
  }
}
