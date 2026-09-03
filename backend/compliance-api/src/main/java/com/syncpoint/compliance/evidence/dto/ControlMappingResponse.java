package com.syncpoint.compliance.evidence.dto;

import com.syncpoint.compliance.evidence.entity.EvidenceSourceType;
import com.syncpoint.compliance.evidence.entity.EvidenceStatus;
import com.syncpoint.compliance.evidence.entity.MappingClassification;
import com.syncpoint.compliance.evidence.entity.MappingType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** One row of the Control Detail "mapped evidence" table — mapping + evidence summary joined. */
public record ControlMappingResponse(
        UUID mappingId,
        UUID evidenceId,
        String evidenceName,
        EvidenceSourceType sourceType,
        String sourceSystem,
        EvidenceStatus evidenceStatus,
        EvidenceResponse.FreshnessState freshness,
        Instant collectedAt,
        MappingType mappingType,
        MappingClassification classification,
        BigDecimal confidence,
        String reason,
        Instant mappedAt
) {
}
