package com.syncpoint.compliance.policy.repository;

import com.syncpoint.compliance.policy.entity.Policy;
import com.syncpoint.compliance.policy.entity.PolicyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PolicyRepository extends JpaRepository<Policy, UUID> {
    List<Policy> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<Policy> findByIdAndOrganizationId(UUID id, UUID organizationId);
    List<Policy> findByStatusAndCycleStartedAtBefore(PolicyStatus status, Instant cutoff);
    Page<Policy> findByOrganizationIdAndStatusOrderByCreatedAtDesc(UUID organizationId, PolicyStatus status, Pageable pageable);
}
