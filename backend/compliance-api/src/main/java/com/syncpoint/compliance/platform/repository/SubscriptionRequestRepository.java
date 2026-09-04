package com.syncpoint.compliance.platform.repository;

import com.syncpoint.compliance.platform.entity.SubscriptionRequest;
import com.syncpoint.compliance.platform.entity.SubscriptionRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRequestRepository extends JpaRepository<SubscriptionRequest, UUID> {
    List<SubscriptionRequest> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<SubscriptionRequest> findByOrganizationIdAndStatus(UUID organizationId, SubscriptionRequestStatus status);
    List<SubscriptionRequest> findByStatusOrderByCreatedAtAsc(SubscriptionRequestStatus status);
    List<SubscriptionRequest> findAllByOrderByCreatedAtDesc();
}
