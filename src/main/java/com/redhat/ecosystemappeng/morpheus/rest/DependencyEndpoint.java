package com.redhat.ecosystemappeng.morpheus.rest;

import java.util.List;

import org.bson.Document;

import com.redhat.ecosystemappeng.morpheus.model.sbom.SbomPackage;
import com.redhat.ecosystemappeng.morpheus.service.SbomPackageRepositoryService;

import jakarta.inject.Inject;
import jakarta.websocket.server.PathParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

@Path("/packages")
public class DependencyEndpoint {
  
  @Inject
  SbomPackageRepositoryService repositoryService;

  @GET
  @Path("/{id}/tree")
  public List<Document> list(@PathParam("id") String id) {
    return repositoryService.dependencyTree(id);
  }

  @GET
  @Path("/{id}/sources")
  public List<Document> listSources(@PathParam("id") String id) {
    return repositoryService.getSourceLocations(id);
  }

  @GET
  @Path("/{id}")
  public SbomPackage get(@PathParam("id") String id) {
    return repositoryService.findById(id);
  }
}
