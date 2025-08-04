package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record FailedComponent(
    String productId, 
    String image,
    String error) {

}
