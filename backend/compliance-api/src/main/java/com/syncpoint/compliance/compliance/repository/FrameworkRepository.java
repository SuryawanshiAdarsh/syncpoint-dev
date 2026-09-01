package com.syncpoint.compliance.compliance.repository;

import com.syncpoint.compliance.compliance.entity.Framework;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FrameworkRepository extends JpaRepository<Framework, UUID> {
    List<Framework> findByActiveTrueOrderByCode();
    Optional<Framework> findByCode(String code);
}
