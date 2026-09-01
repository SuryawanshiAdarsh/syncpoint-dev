package com.syncpoint.compliance.ai.dto;

import com.syncpoint.compliance.evidence.entity.MappingClassification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AiMappingResult(
        MappingClassification classification,
        BigDecimal confidence,
        String reason,
        List<String> supportedRequirements,
        List<String> missingRequirements,
        String recommendedAction,
        String provider,
        String model,
        String promptVersion,
        Map<String, Object> raw
) {
}
