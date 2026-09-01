package com.syncpoint.compliance.organization.repository;

import com.syncpoint.compliance.organization.entity.OrganizationMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {
    List<OrganizationMember> findByOrganizationIdOrderByCreatedAtAsc(UUID organizationId);
    List<OrganizationMember> findByUserIdOrderByCreatedAtAsc(UUID userId);
    Optional<OrganizationMember> findByOrganizationIdAndUserId(UUID organizationId, UUID userId);
    Optional<OrganizationMember> findByIdAndOrganizationId(UUID id, UUID organizationId);
    boolean existsByOrganizationIdAndUserId(UUID organizationId, UUID userId);
}
