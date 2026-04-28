/*
 * SPDX-FileCopyrightText: Copyright (c) 2026, Red Hat Inc. & AFFILIATES. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.redhat.ecosystemappeng.morpheus.service;

import java.util.List;

import org.jboss.logging.Logger;

import com.redhat.ecosystemappeng.morpheus.model.Product;
import com.redhat.ecosystemappeng.morpheus.repository.ProductRepositoryService;

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
    LOGGER.debugf("Getting user name for product %s", id);
    return repository.getUserName(id);
  }
}
