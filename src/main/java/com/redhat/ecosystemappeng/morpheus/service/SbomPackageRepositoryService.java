package com.redhat.ecosystemappeng.morpheus.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.bson.Document;
import org.bson.conversions.Bson;

import com.mongodb.client.model.Aggregates;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.GraphLookupOptions;
import com.mongodb.client.model.Projections;
import com.redhat.ecosystemappeng.morpheus.model.sbom.DependencyElement;
import com.redhat.ecosystemappeng.morpheus.model.sbom.SbomPackage;

import io.quarkus.mongodb.panache.PanacheMongoRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SbomPackageRepositoryService implements PanacheMongoRepositoryBase<SbomPackage, String> {

  public List<Document> dependencyTree(String packageId) {
    // Define the aggregation pipeline with graph lookup limited to one level of
    // dependencies
    List<Bson> pipeline = Arrays.asList(
        // Step 1: Match the root package
        Aggregates.match(Filters.eq("_id", packageId)),

        // Step 2: Perform graph lookup with maxDepth set to 1
        Aggregates.graphLookup(
            "packages", // from: collection to search
            "$dependencies", // startWith: initial dependencies to start the search
            "dependencies", // connectFromField: field containing dependencies in each package
            "_id", // connectToField: field to match in the packages collection
            "directDependencies", // as: output field where the result of graph lookup is stored
            new GraphLookupOptions().maxDepth(0)),

        // Step 3: Project only the necessary fields
        Aggregates.project(Projections.fields(
            Projections.include("_id", "name", "directDependencies._id", "directDependencies.name"))));

    // Run the aggregation and return the result
    return mongoCollection().aggregate(pipeline, Document.class).allowDiskUse(true).into(new ArrayList<>());
  }

  public List<Document> getSourceLocations(String packageId) {
    // Define the aggregation pipeline with graph lookup limited to one level of
    // dependencies
    List<Bson> pipeline = Arrays.asList(
        // Step 1: Match the root package
        Aggregates.match(Filters.eq("_id", packageId)),

        // Step 2: Perform graph lookup with maxDepth set to 1
        Aggregates.graphLookup(
            "packages", // from: collection to search
            "$dependencies", // startWith: initial dependencies to start the search
            "dependencies", // connectFromField: field containing dependencies in each package
            "_id", // connectToField: field to match in the packages collection
            "dependencies", // as: output field where the result of graph lookup is stored
            new GraphLookupOptions().maxDepth(0).restrictSearchWithMatch(Filters.ne("downloadLocation", "https://access.redhat.com/downloads/content/package-browser"))),

        // Step 3: Project only the necessary fields
        Aggregates.project(Projections.fields(
            Projections.include("_id", "name", "dependencies._id", "dependencies.name", "dependencies.downloadLocation"))));

    // Run the aggregation and return the result
    return mongoCollection().aggregate(pipeline, Document.class).allowDiskUse(true).into(new ArrayList<>());
  }
}
