package com.redhat.ecosystemappeng.morpheus.rest.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.RestResponse;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;
import jakarta.validation.ValidationException;
import org.jboss.resteasy.reactive.server.UnwrapException;


@UnwrapException({RuntimeException.class})
public class BaseAuditEndpoint {

  private static final Logger LOGGER = Logger.getLogger(BaseAuditEndpoint.class);
  @ServerExceptionMapper
  public RestResponse<String> mapValidation(ValidationException ex) {
      LOGGER.error("Input validation of request failed, details => " + ex.getMessage(), ex);
      return RestResponse.status(Response.Status.BAD_REQUEST, "Input validation error on request body/query parameters, details: " + ex.getMessage());
   }

  @ServerExceptionMapper
  public RestResponse<String> mapIllegalArgument(IllegalArgumentException ex) {
      LOGGER.error("Input validation of request failed, details => " + ex.getMessage(), ex);
      return RestResponse.status(Response.Status.BAD_REQUEST, "Input validation error on query parameters, details: " + ex.getMessage());
   }


  @ServerExceptionMapper
  public RestResponse<String> mapNotFound(NotFoundException ex) {
      LOGGER.error("Resource not found, details => " + ex.getMessage(), ex);
      return RestResponse.status(Response.Status.NOT_FOUND, "resource not found, details=> " + ex.getMessage());
   }



  @ServerExceptionMapper
  public RestResponse<String> mapJsonProcessingException(JsonProcessingException ex) {
      LOGGER.errorf("error encountered for serializing json, details of error -> %s", ex.getMessage(), ex);
      return RestResponse.status(Response.Status.INTERNAL_SERVER_ERROR, "General Error encountered, Contact admin");
   }

//  @ServerExceptionMapper
//  public RestResponse<String> mapGeneral(Exception ex) {
//      LOGGER.errorf("General unexpected error encountered during API request, details of error -> %s", ex.getMessage(), ex);
//      return RestResponse.status(Response.Status.INTERNAL_SERVER_ERROR, "General Error encountered, Contact admin");
//   }


}
