package com.syncpoint.compliance.collection.repository;

import com.syncpoint.compliance.collection.entity.CollectionRun;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CollectionRunRepository extends JpaRepository<CollectionRun, UUID> {
    List<CollectionRun> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    List<CollectionRun> findByOrganizationIdAndIntegrationIdOrderByCreatedAtDesc(UUID organizationId, UUID integrationId);
    Optional<CollectionRun> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
