package com.syncpoint.compliance.compliance.repository;

import com.syncpoint.compliance.compliance.entity.Control;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ControlRepository extends JpaRepository<Control, UUID> {
    List<Control> findByFrameworkIdAndActiveTrueOrderByCode(UUID frameworkId);
    List<Control> findByActiveTrueOrderByCode();
}
