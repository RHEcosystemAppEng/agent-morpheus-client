package com.redhat.ecosystemappeng.morpheus.service;

import java.util.ArrayList;
import java.util.List;

import org.bson.conversions.Bson;

import com.mongodb.client.model.Filters;
import com.redhat.ecosystemappeng.morpheus.model.sbom.Product;

import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProductRepositoryService implements PanacheMongoRepository<Product> {

  public List<Product> find(String product, String version) {
    List<Bson> filters = new ArrayList<>();
    if(product != null && !product.isBlank()) {
      filters.add(Filters.eq("name", product));
    }
    if(version != null && !version.isBlank()) {
      filters.add(Filters.eq("version", version));
    }
    if(filters.isEmpty()) {
      filters.add(Filters.empty());
    }
    return find(Filters.and(filters)).list();
  }

}
