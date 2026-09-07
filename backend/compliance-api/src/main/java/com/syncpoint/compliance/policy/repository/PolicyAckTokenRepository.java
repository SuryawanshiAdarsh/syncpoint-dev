package com.syncpoint.compliance.policy.repository;

import com.syncpoint.compliance.policy.entity.PolicyAckToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PolicyAckTokenRepository extends JpaRepository<PolicyAckToken, UUID> {
    Optional<PolicyAckToken> findByTokenHash(String tokenHash);
    void deleteByOrganizationIdAndUserId(UUID organizationId, UUID userId);
}
