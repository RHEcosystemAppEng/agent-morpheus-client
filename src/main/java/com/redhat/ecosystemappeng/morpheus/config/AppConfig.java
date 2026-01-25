package com.redhat.ecosystemappeng.morpheus.config;

import java.util.List;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;
import io.smallrye.config.WithName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import io.quarkus.runtime.annotations.StaticInitSafe;

@StaticInitSafe
@ConfigMapping(prefix = "exploit-iq")
public interface AppConfig {
    Image image();

    interface Image {
        Source source();
        interface Source {
            @WithName("location-keys")
            @WithDefault("image.source-location,org.opencontainers.image.source,syft:image:labels:io.openshift.build.source-location")
            @Size(min = 1, max = 10)
            List<@NotBlank @Pattern(regexp = "^[a-zA-Z0-9.:_/-]+$", message = "Invalid key format") String> locationKeys();

            @WithName("commit-id-keys")
            @WithDefault("image.source.commit-id,org.opencontainers.image.revision,syft:image:labels:io.openshift.build.commit.id")
            @Size(min = 1, max = 10)
            List<@NotBlank @Pattern(regexp = "^[a-zA-Z0-9.:_/-]+$", message = "Invalid key format") String> commitIdKeys();
        }
    }
}