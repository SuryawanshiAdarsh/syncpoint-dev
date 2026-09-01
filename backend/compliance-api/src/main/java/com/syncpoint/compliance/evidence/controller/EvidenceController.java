package com.syncpoint.compliance.evidence.controller;

import com.syncpoint.compliance.evidence.dto.CreateMappingRequest;
import com.syncpoint.compliance.evidence.dto.CreateReviewRequest;
import com.syncpoint.compliance.evidence.dto.EvidenceResponse;
import com.syncpoint.compliance.evidence.dto.MappingResponse;
import com.syncpoint.compliance.evidence.dto.ReviewResponse;
import com.syncpoint.compliance.evidence.service.EvidenceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
@RequestMapping("/api/v1/evidence")
public class EvidenceController {

    private final EvidenceService service;

    public EvidenceController(EvidenceService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<EvidenceResponse>> list() {
        return ResponseEntity.ok(service.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvidenceResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(service.get(id));
    }

    @PostMapping(value = "/upload", consumes = { "multipart/form-data" })
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<EvidenceResponse> upload(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.upload(name, description, file));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/mappings")
    public ResponseEntity<List<MappingResponse>> mappings(@PathVariable UUID id) {
        return ResponseEntity.ok(service.listMappings(id));
    }

    @PostMapping("/{id}/map")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<MappingResponse> createMapping(@PathVariable UUID id,
                                                         @Valid @RequestBody CreateMappingRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createMapping(id, req));
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<ReviewResponse> createReview(@PathVariable UUID id,
                                                       @Valid @RequestBody CreateReviewRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createReview(id, req));
    }
}
