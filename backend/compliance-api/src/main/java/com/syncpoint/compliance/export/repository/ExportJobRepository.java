package com.syncpoint.compliance.export.repository;

import com.syncpoint.compliance.export.entity.ExportJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ExportJobRepository extends JpaRepository<ExportJob, UUID> {
    Optional<ExportJob> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
