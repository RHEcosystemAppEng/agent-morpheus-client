package com.redhat.ecosystemappeng.morpheus.model.sbom;

import java.util.List;

import org.bson.codecs.pojo.annotations.BsonId;

import io.quarkus.mongodb.panache.common.MongoEntity;
import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
@MongoEntity(collection = "packages")
public record SbomPackage(
    @BsonId String _id,
    String name,
    String versionInfo,
    String supplier,
    String homepage,
    // For container images its the image location: registry.redhat.io/openshift4/ose-cluster-csi-snapshot-controller-rhel9-operator:v4.16.0-202410172201.p0.g439826e.assembly.stream.el9
    // For rpms it's a website where you can look up for the name: https://access.redhat.com/downloads/content/package-browser
    // For programming language packages (Go, npm, etc.) it's the link to the source code: https://proxy.golang.org/k8s.io/apimachinery/pkg/runtime/serializer/recognizer/@v/v0.29.1.zip
    String downloadLocation, 
    String purl,
    List<SecurityRef> securityRefs,
    String packageFileName, //rpms
    List<String> dependencies) {

}
