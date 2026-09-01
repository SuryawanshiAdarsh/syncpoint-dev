package com.syncpoint.compliance.integrations.connector;

/** One artifact produced by a collector. Content is opaque JSON/text bytes. */
public record CollectedItem(
        String evidenceType,
        String displayName,
        String description,
        byte[] payload,
        String mimeType
) {
}
