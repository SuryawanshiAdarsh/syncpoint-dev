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
 * The entire login-free policy acknowledgment portal surface — deliberately just these four
 * endpoints, all resolved from a magic-link token (see PolicyAckTokenService), never from the
 * normal JWT/TenantContext session. Publicly routable (see SecurityConfig.PUBLIC_ENDPOINTS) but
 * not unauthenticated: every handler validates the token before doing anything, and is also
 * rate-limited (see AuthRateLimitFilter).
 */
@RestController
@RequestMapping("/api/v1/policy-portal")
public class PolicyPortalController {

    private final PolicyPortalService service;

    public PolicyPortalController(PolicyPortalService service) {
        this.service = service;
    }

    @GetMapping("/policies")
    public ResponseEntity<PolicyPortalPageResponse> list(
            @RequestParam("token") String token,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        return ResponseEntity.ok(service.list(token, page, size));
    }

    @GetMapping("/policies/{id}")
    public ResponseEntity<PolicyPortalDetailResponse> get(
            @PathVariable UUID id, @RequestParam("token") String token) {
        return ResponseEntity.ok(service.get(token, id));
    }

    @GetMapping("/policies/{id}/document")
    public ResponseEntity<byte[]> document(@PathVariable UUID id, @RequestParam("token") String token) {
        PolicyPortalService.DocumentContent doc = service.document(token, id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .body(doc.bytes());
    }

    @PostMapping("/policies/{id}/acknowledge")
    public ResponseEntity<Void> acknowledge(@PathVariable UUID id, @RequestParam("token") String token) {
        service.acknowledge(token, id);
        return ResponseEntity.noContent().build();
    }
}
