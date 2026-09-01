package com.syncpoint.compliance.compliance.service;

import com.syncpoint.compliance.compliance.dto.ControlStatus;
import com.syncpoint.compliance.evidence.entity.EvidenceControlMapping;
import com.syncpoint.compliance.evidence.entity.MappingClassification;
import com.syncpoint.compliance.evidence.entity.MappingType;
import com.syncpoint.compliance.evidence.repository.EvidenceControlMappingRepository;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Derives per-org control status from evidence-control mappings.
 * <ul>
 *   <li>MISSING = no mappings.</li>
 *   <li>NEEDS_REVIEW = only AI_SUGGESTED mappings (no human decisions yet).</li>
 *   <li>COVERED = at least one HUMAN_CONFIRMED with classification COVERED.</li>
 *   <li>PARTIAL = HUMAN_CONFIRMED with PARTIAL and nothing COVERED,
 *       or a mix that includes HUMAN_REJECTED.</li>
 * </ul>
 * This is a product signal, not a legal compliance determination.
 */
@Component
class MappingBasedControlStatusResolver implements ControlStatusResolver {

    private final EvidenceControlMappingRepository mappings;

    MappingBasedControlStatusResolver(EvidenceControlMappingRepository mappings) {
        this.mappings = mappings;
    }

    @Override
    public Map<UUID, ControlStatus> statusesFor(UUID organizationId, List<UUID> controlIds) {
        Map<UUID, ControlStatus> out = new HashMap<>();
        if (controlIds == null || controlIds.isEmpty()) return out;

        Map<UUID, List<EvidenceControlMapping>> byControl = new HashMap<>();
        for (EvidenceControlMapping m : mappings.findByOrganizationId(organizationId)) {
            byControl.computeIfAbsent(m.getControlId(), k -> new java.util.ArrayList<>()).add(m);
        }
        for (UUID id : controlIds) {
            List<EvidenceControlMapping> list = byControl.get(id);
            out.put(id, classify(list));
        }
        return out;
    }

    private static ControlStatus classify(List<EvidenceControlMapping> ms) {
        if (ms == null || ms.isEmpty()) return ControlStatus.MISSING;

        boolean anyConfirmed = false;
        boolean anyRejected = false;
        boolean covered = false;
        boolean partial = false;
        boolean onlyAiSuggested = true;

        for (EvidenceControlMapping m : ms) {
            if (m.getMappingType() != MappingType.AI_SUGGESTED) onlyAiSuggested = false;
            if (m.getMappingType() == MappingType.HUMAN_CONFIRMED) {
                anyConfirmed = true;
                if (m.getClassification() == MappingClassification.COVERED) covered = true;
                if (m.getClassification() == MappingClassification.PARTIAL) partial = true;
            } else if (m.getMappingType() == MappingType.HUMAN_REJECTED) {
                anyRejected = true;
            }
        }
        if (onlyAiSuggested) return ControlStatus.NEEDS_REVIEW;
        if (covered && !anyRejected) return ControlStatus.COVERED;
        if (anyConfirmed || partial) return ControlStatus.PARTIAL;
        return ControlStatus.NEEDS_REVIEW;
    }
}
