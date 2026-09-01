package com.syncpoint.compliance.evidence.dto;

import com.syncpoint.compliance.evidence.entity.MappingClassification;
import com.syncpoint.compliance.evidence.entity.MappingType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MappingResponse(
        UUID id,
        UUID evidenceId,
        UUID controlId,
        String controlCode,
        MappingType mappingType,
        MappingClassification classification,
        BigDecimal confidence,
        String reason,
        Instant createdAt
) {
}
