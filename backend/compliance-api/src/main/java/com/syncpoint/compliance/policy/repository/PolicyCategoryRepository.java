package com.syncpoint.compliance.policy.repository;

import com.syncpoint.compliance.policy.entity.PolicyCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PolicyCategoryRepository extends JpaRepository<PolicyCategory, UUID> {
    List<PolicyCategory> findAllByOrderBySortOrderAsc();
}
