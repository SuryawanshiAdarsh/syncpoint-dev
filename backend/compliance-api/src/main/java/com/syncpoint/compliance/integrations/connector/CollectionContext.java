package com.syncpoint.compliance.integrations.connector;

import java.util.Map;
import java.util.UUID;

public record CollectionContext(
        UUID organizationId,
        UUID integrationId,
        byte[] credentialPlaintext,
        Map<String, Object> configuration,
        String collectorVersion
) {
}
