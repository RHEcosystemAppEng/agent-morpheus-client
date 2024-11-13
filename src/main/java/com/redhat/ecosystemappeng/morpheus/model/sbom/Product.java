package com.redhat.ecosystemappeng.morpheus.model.sbom;

import java.util.List;

import org.bson.codecs.pojo.annotations.BsonId;
import org.bson.types.ObjectId;

import io.quarkus.mongodb.panache.common.MongoEntity;
import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
@MongoEntity(collection = "products")
public record Product(
    @BsonId ObjectId _id,
    String ref,
    String name,
    String version,
    String namespace,
    CreationInfo creationInfo,
    String dataLicense,
    List<ExtractedLicensingInfo> extractedLicensingInfos,
    String rootPackage) {
}
