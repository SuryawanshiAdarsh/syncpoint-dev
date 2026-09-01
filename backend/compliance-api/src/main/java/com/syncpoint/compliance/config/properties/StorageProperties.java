package com.syncpoint.compliance.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "syncpoint.storage")
public record StorageProperties(
        String endpoint,
        String accessKey,
        String secretKey,
        String bucket
) {
    public StorageProperties {
        if (endpoint == null || endpoint.isBlank()) throw new IllegalStateException("syncpoint.storage.endpoint must be set");
        if (bucket == null || bucket.isBlank())     throw new IllegalStateException("syncpoint.storage.bucket must be set");
    }
}
