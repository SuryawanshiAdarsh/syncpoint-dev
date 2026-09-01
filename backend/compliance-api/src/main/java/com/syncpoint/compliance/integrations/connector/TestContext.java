package com.syncpoint.compliance.integrations.connector;

import java.util.Map;

public record TestContext(
        byte[] credentialPlaintext,
        Map<String, Object> configuration
) {
}
