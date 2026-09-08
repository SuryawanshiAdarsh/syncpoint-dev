package com.syncpoint.compliance.compliance.dto;

import com.syncpoint.compliance.compliance.entity.ControlExceptionStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ControlExceptionResponse(
        UUID id,
        UUID controlId,
        String controlCode,
        String description,
        LocalDate detectedDate,
        LocalDate remediatedDate,
        ControlExceptionStatus status,
        String createdByName,
        Instant createdAt
) {
}
