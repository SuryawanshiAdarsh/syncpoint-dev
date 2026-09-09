package com.syncpoint.compliance.auditor.repository;

import com.syncpoint.compliance.auditor.entity.AuditorRequest;
import com.syncpoint.compliance.auditor.entity.AuditorRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuditorRequestRepository extends JpaRepository<AuditorRequest, UUID> {
    List<AuditorRequest> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    List<AuditorRequest> findByOrganizationIdAndStatusOrderByCreatedAtDesc(UUID organizationId, AuditorRequestStatus status);
    List<AuditorRequest> findByControlIdAndOrganizationIdOrderByCreatedAtDesc(UUID controlId, UUID organizationId);
    Optional<AuditorRequest> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
