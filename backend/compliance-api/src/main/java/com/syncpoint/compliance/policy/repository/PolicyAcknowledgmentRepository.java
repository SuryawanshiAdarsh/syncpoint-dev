package com.syncpoint.compliance.policy.repository;

import com.syncpoint.compliance.policy.entity.PolicyAcknowledgment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PolicyAcknowledgmentRepository extends JpaRepository<PolicyAcknowledgment, UUID> {
    List<PolicyAcknowledgment> findByOrganizationId(UUID organizationId);
    List<PolicyAcknowledgment> findByPolicyIdAndPolicyVersionAndAttestationCycle(UUID policyId, int policyVersion, int attestationCycle);
    Optional<PolicyAcknowledgment> findByPolicyIdAndPolicyVersionAndAttestationCycleAndUserId(
            UUID policyId, int policyVersion, int attestationCycle, UUID userId);
}
