package com.syncpoint.compliance.risk.repository;

import com.syncpoint.compliance.risk.entity.Risk;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RiskRepository extends JpaRepository<Risk, UUID> {
    List<Risk> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<Risk> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
