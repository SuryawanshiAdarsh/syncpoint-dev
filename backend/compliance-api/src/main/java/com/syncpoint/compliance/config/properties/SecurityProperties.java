package com.syncpoint.compliance.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

@ConfigurationProperties(prefix = "syncpoint.security")
public record SecurityProperties(
        String corsAllowedOrigins,
        RateLimit rateLimit
) {
    public SecurityProperties {
        if (rateLimit == null) rateLimit = new RateLimit(20, 60);
    }

    public List<String> corsAllowedOriginsList() {
        if (corsAllowedOrigins == null || corsAllowedOrigins.isBlank()) return List.of();
        return Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public record RateLimit(int authMax, long windowSeconds) {
        public RateLimit {
            if (authMax <= 0)       authMax = 20;
            if (windowSeconds <= 0) windowSeconds = 60;
        }
    }
}
