package com.syncpoint.compliance.evidence.repository;

import com.syncpoint.compliance.evidence.entity.EvidenceVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EvidenceVersionRepository extends JpaRepository<EvidenceVersion, UUID> {
    List<EvidenceVersion> findByEvidenceIdOrderByVersionDesc(UUID evidenceId);
    Optional<EvidenceVersion> findFirstByEvidenceIdOrderByVersionDesc(UUID evidenceId);
}
