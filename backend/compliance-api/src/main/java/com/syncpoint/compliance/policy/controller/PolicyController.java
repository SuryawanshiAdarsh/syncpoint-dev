package com.syncpoint.compliance.policy.controller;

import com.syncpoint.compliance.policy.dto.PolicyCoverageResponse;
import com.syncpoint.compliance.policy.dto.PolicyDetailResponse;
import com.syncpoint.compliance.policy.dto.PolicyResponse;
import com.syncpoint.compliance.policy.dto.UpdatePolicyRequest;
import com.syncpoint.compliance.policy.service.PolicyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/policies")
public class PolicyController {

    private final PolicyService service;

    public PolicyController(PolicyService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<PolicyResponse>> list() {
        return ResponseEntity.ok(service.list());
    }

    @GetMapping("/coverage")
    public ResponseEntity<PolicyCoverageResponse> coverage() {
        return ResponseEntity.ok(service.getCoverage());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> categories() {
        return ResponseEntity.ok(service.listCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PolicyDetailResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(service.get(id));
    }

    @PostMapping(consumes = { "multipart/form-data" })
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<PolicyResponse> create(
            @RequestParam("title") String title,
            @RequestParam("category") String category,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(title, category, description, file));
    }

    @PostMapping(value = "/{id}/versions", consumes = { "multipart/form-data" })
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<PolicyResponse> addVersion(@PathVariable UUID id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addVersion(id, file));
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<PolicyResponse> acknowledge(@PathVariable UUID id) {
        return ResponseEntity.ok(service.acknowledge(id));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<PolicyResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdatePolicyRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<PolicyResponse> archive(@PathVariable UUID id) {
        return ResponseEntity.ok(service.archive(id));
    }

    @PostMapping("/{id}/remind")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> remind(@PathVariable UUID id) {
        service.sendReminder(id);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/{id}/mappings/confirm-all")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> confirmAllMappings(@PathVariable UUID id) {
        service.confirmAllSuggested(id);
        return ResponseEntity.noContent().build();
    }
}
