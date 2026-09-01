package com.syncpoint.compliance.evidence.dto;

import com.syncpoint.compliance.evidence.entity.MappingClassification;
import com.syncpoint.compliance.evidence.entity.MappingType;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateMappingRequest(
        @NotNull UUID controlId,
        @NotNull MappingType mappingType,
        MappingClassification classification,
        BigDecimal confidence,
        String reason
) {
}
