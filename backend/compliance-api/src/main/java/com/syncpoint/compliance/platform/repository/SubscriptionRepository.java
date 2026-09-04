package com.syncpoint.compliance.platform.repository;

import com.syncpoint.compliance.platform.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findByOrganizationId(UUID organizationId);
    List<Subscription> findByOrganizationIdIn(List<UUID> organizationIds);
}
