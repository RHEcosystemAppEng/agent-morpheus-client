package com.redhat.ecosystemappeng.morpheus.model;

import io.quarkus.runtime.annotations.RegisterForReflection;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;

@Schema(name = "ProductSummary", description = "Product metadata and reports data")
@RegisterForReflection
public record ProductSummary(
    @Schema(required = true, description = "Product data", type = SchemaType.OBJECT, implementation = Product.class)
    Product data,
    @Schema(required = true, description = "Product reports summary data", type = SchemaType.OBJECT, implementation = ProductReportsSummary.class)
    ProductReportsSummary summary
) {}


