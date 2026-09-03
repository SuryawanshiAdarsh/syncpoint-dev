package com.syncpoint.compliance.ai.dto;

import com.syncpoint.compliance.evidence.entity.MappingClassification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** AI reasoning summary for the Control Detail "AI analysis" panel. */
public record AiAnalysisSummaryResponse(
        UUID id,
        UUID evidenceId,
        String evidenceName,
        String provider,
        String model,
        String promptVersion,
        MappingClassification classification,
        BigDecimal confidence,
        String reason,
        Instant createdAt
) {
}
