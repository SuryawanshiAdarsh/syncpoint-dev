package com.syncpoint.compliance.compliance.controller;

import com.syncpoint.compliance.compliance.dto.ControlResponse;
import com.syncpoint.compliance.compliance.dto.FrameworkResponse;
import com.syncpoint.compliance.compliance.service.ComplianceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/frameworks")
public class FrameworkController {

    private final ComplianceService complianceService;

    public FrameworkController(ComplianceService complianceService) {
        this.complianceService = complianceService;
    }

    @GetMapping
    public ResponseEntity<List<FrameworkResponse>> list() {
        return ResponseEntity.ok(complianceService.listFrameworks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FrameworkResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(complianceService.getFramework(id));
    }

    @GetMapping("/{id}/controls")
    public ResponseEntity<List<ControlResponse>> controls(@PathVariable UUID id) {
        return ResponseEntity.ok(complianceService.listControlsForFramework(id));
    }
}
