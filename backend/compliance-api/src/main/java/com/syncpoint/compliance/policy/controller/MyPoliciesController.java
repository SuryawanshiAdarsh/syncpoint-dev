package com.syncpoint.compliance.policy.controller;

import com.syncpoint.compliance.policy.dto.PolicyPortalDetailResponse;
import com.syncpoint.compliance.policy.dto.PolicyPortalPageResponse;
import com.syncpoint.compliance.policy.service.PolicyPortalService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * The real-login counterpart to PolicyPortalController: identity comes from the normal JWT
 * session (TenantContext), not a magic-link token. Reachable by every role; an ACKNOWLEDGER-role
 * session can reach ONLY this prefix plus /api/v1/auth/me (see SecurityConfig).
 */
@RestController
@RequestMapping("/api/v1/my-policies")
public class MyPoliciesController {

    private final PolicyPortalService service;

    public MyPoliciesController(PolicyPortalService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<PolicyPortalPageResponse> list(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        return ResponseEntity.ok(service.listMine(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PolicyPortalDetailResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getMine(id));
    }

    @GetMapping("/{id}/document")
    public ResponseEntity<byte[]> document(@PathVariable UUID id) {
        PolicyPortalService.DocumentContent doc = service.documentMine(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(doc.bytes());
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<Void> acknowledge(@PathVariable UUID id) {
        service.acknowledgeMine(id);
        return ResponseEntity.noContent().build();
    }
}
