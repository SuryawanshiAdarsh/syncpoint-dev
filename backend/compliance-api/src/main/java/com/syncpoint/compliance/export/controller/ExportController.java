package com.syncpoint.compliance.export.controller;

import com.syncpoint.compliance.export.dto.ExportJobResponse;
import com.syncpoint.compliance.export.service.ExportService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/exports")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @PostMapping("/audit-package")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<ExportJobResponse> start() {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(exportService.start());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExportJobResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(exportService.get(id));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<ByteArrayResource> download(@PathVariable UUID id) {
        byte[] bytes = exportService.downloadCompleted(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"syncpoint-audit-package-" + id + ".zip\"")
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }
}
