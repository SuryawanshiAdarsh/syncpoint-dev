package com.syncpoint.compliance.integrations.controller;

import com.syncpoint.compliance.integrations.dto.GitHubIntegrationRequest;
import com.syncpoint.compliance.integrations.dto.IntegrationResponse;
import com.syncpoint.compliance.integrations.dto.TestConnectionResponse;
import com.syncpoint.compliance.integrations.dto.UpdateScheduleRequest;
import com.syncpoint.compliance.integrations.service.IntegrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/integrations")
public class IntegrationController {

    private final IntegrationService integrationService;

    public IntegrationController(IntegrationService integrationService) {
        this.integrationService = integrationService;
    }

    @GetMapping
    public ResponseEntity<List<IntegrationResponse>> list() {
        return ResponseEntity.ok(integrationService.list());
    }

    @GetMapping("/{id}")
    public ResponseEntity<IntegrationResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(integrationService.get(id));
    }

    @PostMapping("/github")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<IntegrationResponse> connectGithub(@Valid @RequestBody GitHubIntegrationRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(integrationService.connectGithub(req));
    }

    @PostMapping("/{id}/test")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<TestConnectionResponse> test(@PathVariable UUID id) {
        return ResponseEntity.ok(integrationService.test(id));
    }

    @PostMapping("/{id}/collect")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Map<String, Object>> collect(@PathVariable UUID id) {
        UUID runId = integrationService.triggerCollection(id);
        return ResponseEntity.accepted().body(Map.of("collectionRunId", runId));
    }

    @PatchMapping("/{id}/schedule")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<IntegrationResponse> updateSchedule(@PathVariable UUID id,
                                                              @Valid @RequestBody UpdateScheduleRequest req) {
        return ResponseEntity.ok(integrationService.updateSchedule(id, req.schedule()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> disconnect(@PathVariable UUID id) {
        integrationService.disconnect(id);
        return ResponseEntity.noContent().build();
    }
}
