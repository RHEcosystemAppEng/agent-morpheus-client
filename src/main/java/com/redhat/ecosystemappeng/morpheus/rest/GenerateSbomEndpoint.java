package com.redhat.ecosystemappeng.morpheus.rest;

import java.io.BufferedReader;
import java.io.InputStreamReader;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/generate-sbom")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class GenerateSbomEndpoint {

    public static class ImageRequest {
        private String image;

        public String getImage() {
            return image;
        }

        public void setImage(String image) {
            this.image = image;
        }
    }

    @POST
    public Response generateSbom(ImageRequest request) {
        String image = request.getImage();

        if (image == null || image.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                        .entity("{\"error\":\"Image name must be provided\"}")
                        .build();
        }

        try {
            String[] command = new String[] {
                "syft",
                image,
                "-o",
                "cyclonedx-json",
            };
            ProcessBuilder pb = new ProcessBuilder(command);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                            .entity("{\"error\":\"Failed to generate SBOM\"}")
                            .build();
            }

            return Response.ok(output.toString()).build();

        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity("{\"error\":\"" + e.getMessage() + "\"}")
                        .build();
        }
    }
}