package com.syncpoint.compliance.integrations.repository;

import com.syncpoint.compliance.integrations.entity.Integration;
import com.syncpoint.compliance.integrations.entity.IntegrationProvider;
import com.syncpoint.compliance.integrations.entity.IntegrationSchedule;
import com.syncpoint.compliance.integrations.entity.IntegrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IntegrationRepository extends JpaRepository<Integration, UUID> {
    List<Integration> findByOrganizationIdOrderByCreatedAt(UUID organizationId);
    Optional<Integration> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Optional<Integration> findByOrganizationIdAndProvider(UUID organizationId, IntegrationProvider provider);

    /** System-wide sweep candidates for the scheduled-collection job (crosses tenants by design). */
    List<Integration> findByStatusAndScheduleNot(IntegrationStatus status, IntegrationSchedule schedule);
}
