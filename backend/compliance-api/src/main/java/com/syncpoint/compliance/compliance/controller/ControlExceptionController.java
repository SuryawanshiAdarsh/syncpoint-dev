package com.syncpoint.compliance.compliance.controller;

import com.syncpoint.compliance.compliance.dto.ControlExceptionResponse;
import com.syncpoint.compliance.compliance.dto.CreateControlExceptionRequest;
import com.syncpoint.compliance.compliance.dto.RemediateControlExceptionRequest;
import com.syncpoint.compliance.compliance.service.ControlExceptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/controls/{controlId}/exceptions")
public class ControlExceptionController {

    private final ControlExceptionService service;

    public ControlExceptionController(ControlExceptionService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ControlExceptionResponse>> list(@PathVariable UUID controlId) {
        return ResponseEntity.ok(service.listForControl(controlId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<ControlExceptionResponse> create(@PathVariable UUID controlId,
                                                            @RequestBody CreateControlExceptionRequest req) {
        return ResponseEntity.ok(service.create(controlId, req));
    }

    @PutMapping("/{exceptionId}/remediate")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<ControlExceptionResponse> remediate(@PathVariable UUID controlId,
                                                               @PathVariable UUID exceptionId,
                                                               @RequestBody RemediateControlExceptionRequest req) {
        return ResponseEntity.ok(service.remediate(controlId, exceptionId, req.remediatedDate()));
    }

    @DeleteMapping("/{exceptionId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID controlId, @PathVariable UUID exceptionId) {
        service.delete(controlId, exceptionId);
        return ResponseEntity.noContent().build();
    }
}
