package com.syncpoint.compliance.dashboard.dto;

import com.syncpoint.compliance.compliance.dto.ControlStatus;

import java.util.UUID;

public record ControlGap(
        UUID controlId,
        String code,
        String title,
        String category,
        ControlStatus status
) {
}
