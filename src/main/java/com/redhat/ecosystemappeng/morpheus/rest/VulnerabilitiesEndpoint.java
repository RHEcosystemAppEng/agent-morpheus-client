package com.redhat.ecosystemappeng.morpheus.rest;

import com.redhat.ecosystemappeng.morpheus.service.VulnerabilityCommentService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/vulnerabilities")
@Produces(MediaType.TEXT_PLAIN)
@Consumes(MediaType.TEXT_PLAIN)
public class VulnerabilitiesEndpoint {

  @Inject
  VulnerabilityCommentService vulnService;
  
  @Path("/{vuln_id}")
  @GET
  public String getDetails(@PathParam("vuln_id") String vulnId) {
    var desc = vulnService.get(vulnId);
    if(desc == null) {
      throw new NotFoundException("No description found for vulnerability with id: " + vulnId); 
    }
    return desc;
  }

  @Path("/{vuln_id}")
  @PUT
  public Response setDetails(@PathParam("vuln_id") String vulnId, String description) {
    vulnService.add(vulnId, description);
    return Response.accepted().build();
  }
}
