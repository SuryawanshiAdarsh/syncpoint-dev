package com.syncpoint.compliance.compliance.repository;

import com.syncpoint.compliance.compliance.entity.ControlOwner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ControlOwnerRepository extends JpaRepository<ControlOwner, UUID> {
    List<ControlOwner> findByOrganizationId(UUID organizationId);
    Optional<ControlOwner> findByOrganizationIdAndControlId(UUID organizationId, UUID controlId);
}
