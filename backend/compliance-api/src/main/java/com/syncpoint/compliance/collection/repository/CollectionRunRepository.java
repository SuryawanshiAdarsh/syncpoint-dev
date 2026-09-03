package com.syncpoint.compliance.collection.repository;

import com.syncpoint.compliance.collection.entity.CollectionRun;
import com.syncpoint.compliance.collection.entity.CollectionRunStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CollectionRunRepository extends JpaRepository<CollectionRun, UUID> {
    List<CollectionRun> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    List<CollectionRun> findByOrganizationIdAndIntegrationIdOrderByCreatedAtDesc(UUID organizationId, UUID integrationId);
    Optional<CollectionRun> findByIdAndOrganizationId(UUID id, UUID organizationId);

    /** Overlap guard for the scheduled sweep — don't queue a run while one is already in flight. */
    boolean existsByIntegrationIdAndStatusIn(UUID integrationId, Collection<CollectionRunStatus> statuses);
}
