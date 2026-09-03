package com.syncpoint.compliance.ai.repository;

import com.syncpoint.compliance.ai.entity.AiAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AiAnalysisRepository extends JpaRepository<AiAnalysis, UUID> {
    List<AiAnalysis> findByEvidenceIdAndOrganizationIdOrderByCreatedAtDesc(UUID evidenceId, UUID organizationId);
    List<AiAnalysis> findByControlIdAndOrganizationIdOrderByCreatedAtDesc(UUID controlId, UUID organizationId);
}
