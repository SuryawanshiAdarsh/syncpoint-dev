package com.syncpoint.compliance.risk.controller;

import com.syncpoint.compliance.risk.dto.AssignRiskOwnerRequest;
import com.syncpoint.compliance.risk.dto.CreateRiskRequest;
import com.syncpoint.compliance.risk.dto.RiskResponse;
import com.syncpoint.compliance.risk.dto.UpdateRiskRequest;
import com.syncpoint.compliance.risk.dto.UpdateRiskStatusRequest;
import com.syncpoint.compliance.risk.service.RiskService;
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
@RequestMapping("/api/v1/risks")
public class RiskController {

    private final RiskService riskService;

    public RiskController(RiskService riskService) {
        this.riskService = riskService;
    }

    @GetMapping
    public ResponseEntity<List<RiskResponse>> list() {
        return ResponseEntity.ok(riskService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RiskResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(riskService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<RiskResponse> create(@RequestBody CreateRiskRequest req) {
        return ResponseEntity.ok(riskService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<RiskResponse> update(@PathVariable UUID id, @RequestBody UpdateRiskRequest req) {
        return ResponseEntity.ok(riskService.update(id, req));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<RiskResponse> updateStatus(@PathVariable UUID id, @RequestBody UpdateRiskStatusRequest req) {
        return ResponseEntity.ok(riskService.updateStatus(id, req.status()));
    }

    @PutMapping("/{id}/owner")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<RiskResponse> assignOwner(@PathVariable UUID id, @RequestBody AssignRiskOwnerRequest req) {
        return ResponseEntity.ok(riskService.assignOwner(id, req.userId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        riskService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
