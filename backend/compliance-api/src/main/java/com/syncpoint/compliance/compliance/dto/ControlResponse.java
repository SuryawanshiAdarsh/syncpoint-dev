package com.syncpoint.compliance.compliance.dto;

import java.util.UUID;

public record ControlResponse(
        UUID id,
        UUID frameworkId,
        String frameworkCode,
        String code,
        String title,
        String description,
        String category,
        ControlStatus status
) {
}
