package com.syncpoint.compliance.auditor.repository;

import com.syncpoint.compliance.auditor.entity.AuditorControlReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditorControlReviewRepository extends JpaRepository<AuditorControlReview, UUID> {
    List<AuditorControlReview> findByOrganizationIdOrderByReviewedAtDesc(UUID organizationId);
    List<AuditorControlReview> findByControlIdAndOrganizationIdOrderByReviewedAtDesc(UUID controlId, UUID organizationId);
}
