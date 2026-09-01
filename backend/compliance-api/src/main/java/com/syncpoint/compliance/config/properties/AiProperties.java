package com.syncpoint.compliance.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "syncpoint.ai")
public record AiProperties(
        String baseUrl,
        boolean enabled,
        Duration timeout,
        String ingestToken
) {
    public AiProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalStateException("syncpoint.ai.base-url must be set");
        }
        if (timeout == null) timeout = Duration.ofSeconds(30);
    }

    public String normalizedBaseUrl() {
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
