package com.syncpoint.compliance.audit.controller;

import com.syncpoint.compliance.audit.dto.AuditEventResponse;
import com.syncpoint.compliance.audit.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit-events")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<List<AuditEventResponse>> list() {
        return ResponseEntity.ok(auditService.list());
    }
}
