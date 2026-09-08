package com.syncpoint.compliance.compliance.repository;

import com.syncpoint.compliance.compliance.entity.ControlException;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ControlExceptionRepository extends JpaRepository<ControlException, UUID> {
    List<ControlException> findByOrganizationIdOrderByDetectedDateDesc(UUID organizationId);
    List<ControlException> findByControlIdAndOrganizationIdOrderByDetectedDateDesc(UUID controlId, UUID organizationId);
    Optional<ControlException> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
