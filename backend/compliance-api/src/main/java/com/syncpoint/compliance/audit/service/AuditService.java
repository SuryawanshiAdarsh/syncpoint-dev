package com.syncpoint.compliance.audit.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.dto.AuditEventResponse;
import com.syncpoint.compliance.audit.entity.AuditEvent;
import com.syncpoint.compliance.audit.repository.AuditEventRepository;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.common.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private final AuditEventRepository repository;
    private final UserRepository userRepository;

    public AuditService(AuditEventRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void record(UUID organizationId, UUID actorUserId, AuditEvents eventType, String entityType, UUID entityId) {
        record(organizationId, actorUserId, eventType, entityType, entityId, Map.of());
    }

    @Transactional
    public void record(UUID organizationId, UUID actorUserId, AuditEvents eventType,
                       String entityType, UUID entityId, Map<String, Object> metadata) {
        repository.save(new AuditEvent(organizationId, actorUserId, eventType.code(), entityType, entityId, metadata));
    }

    /** Fetch-all + client-side filter, matching the convention already used by Evidence/Controls/Activity. */
    @Transactional(readOnly = true)
    public List<AuditEventResponse> list() {
        UUID orgId = TenantContext.require().organizationId();
        List<AuditEvent> events = repository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
        if (events.isEmpty()) return List.of();

        var actorIds = events.stream()
                .map(AuditEvent::getActorUserId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        var usersById = userRepository.findAllById(actorIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return events.stream().map(e -> {
            User actor = e.getActorUserId() == null ? null : usersById.get(e.getActorUserId());
            return new AuditEventResponse(
                    e.getId(), e.getEventType(), e.getEntityType(), e.getEntityId(),
                    e.getActorUserId(),
                    actor == null ? null : actor.getName(),
                    actor == null ? null : actor.getEmail(),
                    e.getMetadata(), e.getCreatedAt());
        }).toList();
    }
}
