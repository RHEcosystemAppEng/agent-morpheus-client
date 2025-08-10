package com.redhat.ecosystemappeng.morpheus.service;

import java.util.List;

import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.model.Product;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class ProductService {

  private static final Logger LOGGER = Logger.getLogger(ProductService.class);
  
  @Inject
  ProductRepositoryService repository;

  @Inject
  UserService userService;

  public void save(Product product) {
    LOGGER.debugf("Saving product %s", product.id());
    repository.save(product, userService.getUserName());
  }
  
  public Product get(String id) {
    LOGGER.debugf("Getting product %s", id);
    Product product = repository.get(id);
    return product;
  }

  public void remove(String id) {
    LOGGER.debugf("Removing product %s", id);
    repository.remove(id);
  }

  public void remove(List<String> ids) {
    LOGGER.debugf("Removing products %s", ids.toString());
    repository.remove(ids);
  }

  public String getUserName(String id) {
    return repository.getUserName(id);
  }
}
