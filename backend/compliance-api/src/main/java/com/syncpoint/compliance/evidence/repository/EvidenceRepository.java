package com.syncpoint.compliance.evidence.repository;

import com.syncpoint.compliance.evidence.entity.Evidence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EvidenceRepository extends JpaRepository<Evidence, UUID> {
    List<Evidence> findByOrganizationIdOrderByCollectedAtDesc(UUID organizationId);
    Optional<Evidence> findByIdAndOrganizationId(UUID id, UUID organizationId);
    long countByOrganizationId(UUID organizationId);
}
