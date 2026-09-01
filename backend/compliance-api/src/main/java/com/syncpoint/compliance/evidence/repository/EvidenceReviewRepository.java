package com.syncpoint.compliance.evidence.repository;

import com.syncpoint.compliance.evidence.entity.EvidenceReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EvidenceReviewRepository extends JpaRepository<EvidenceReview, UUID> {
    List<EvidenceReview> findByEvidenceIdAndOrganizationIdOrderByReviewedAtDesc(UUID evidenceId, UUID organizationId);
}
