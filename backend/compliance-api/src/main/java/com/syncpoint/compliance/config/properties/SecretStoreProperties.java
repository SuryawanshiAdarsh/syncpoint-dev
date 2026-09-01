package com.syncpoint.compliance.config.properties;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "syncpoint.secrets")
public record SecretStoreProperties(
        String masterKey
) {
    public boolean hasMasterKey() {
        return masterKey != null && !masterKey.isBlank();
    }
}
