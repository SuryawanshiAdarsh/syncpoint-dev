package com.syncpoint.compliance.audit.service;

import com.syncpoint.compliance.audit.entity.AuditEvent;
import com.syncpoint.compliance.audit.repository.AuditEventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
public class AuditService {

    private final AuditEventRepository repository;

    public AuditService(AuditEventRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(UUID organizationId, UUID actorUserId, String eventType, String entityType, UUID entityId) {
        record(organizationId, actorUserId, eventType, entityType, entityId, Map.of());
    }

    @Transactional
    public void record(UUID organizationId, UUID actorUserId, String eventType,
                       String entityType, UUID entityId, Map<String, Object> metadata) {
        repository.save(new AuditEvent(organizationId, actorUserId, eventType, entityType, entityId, metadata));
    }
}
