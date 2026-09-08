package com.syncpoint.compliance.risk.repository;

import com.syncpoint.compliance.risk.entity.RiskControlLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RiskControlLinkRepository extends JpaRepository<RiskControlLink, UUID> {
    List<RiskControlLink> findByOrganizationId(UUID organizationId);
    List<RiskControlLink> findByRiskIdAndOrganizationId(UUID riskId, UUID organizationId);
    void deleteByRiskIdAndOrganizationId(UUID riskId, UUID organizationId);
}
