package com.syncpoint.compliance.compliance.dto;

import java.util.UUID;

public record FrameworkResponse(
        UUID id,
        String code,
        String name,
        String version,
        boolean active
) {
}
