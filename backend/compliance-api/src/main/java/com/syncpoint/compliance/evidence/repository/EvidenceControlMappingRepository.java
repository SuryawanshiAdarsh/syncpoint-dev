package com.syncpoint.compliance.evidence.repository;

import com.syncpoint.compliance.evidence.entity.EvidenceControlMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EvidenceControlMappingRepository extends JpaRepository<EvidenceControlMapping, UUID> {
    List<EvidenceControlMapping> findByOrganizationId(UUID organizationId);
    List<EvidenceControlMapping> findByEvidenceIdAndOrganizationId(UUID evidenceId, UUID organizationId);
    List<EvidenceControlMapping> findByControlIdAndOrganizationId(UUID controlId, UUID organizationId);
    Optional<EvidenceControlMapping> findByIdAndEvidenceIdAndOrganizationId(UUID id, UUID evidenceId, UUID organizationId);
}
