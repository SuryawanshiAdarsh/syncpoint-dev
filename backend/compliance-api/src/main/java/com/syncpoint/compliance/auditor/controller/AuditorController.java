package com.syncpoint.compliance.auditor.controller;

import com.syncpoint.compliance.auditor.dto.AuditorControlReviewResponse;
import com.syncpoint.compliance.auditor.dto.AuditorOverviewResponse;
import com.syncpoint.compliance.auditor.dto.AuditorRequestResponse;
import com.syncpoint.compliance.auditor.dto.CreateAuditorRequestRequest;
import com.syncpoint.compliance.auditor.dto.MarkControlReviewedRequest;
import com.syncpoint.compliance.auditor.service.AuditorService;
import com.syncpoint.compliance.compliance.dto.ControlResponse;
import com.syncpoint.compliance.compliance.dto.ControlExceptionResponse;
import com.syncpoint.compliance.evidence.dto.EvidenceResponse;
import com.syncpoint.compliance.policy.dto.PolicyResponse;
import com.syncpoint.compliance.risk.dto.RiskResponse;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * The invited-auditor workspace. Reachable by any authenticated session, but a Role.AUDITOR
 * session can reach ONLY this prefix plus /api/v1/auth/me (see SecurityConfig) — no
 * @PreAuthorize needed here since the restriction is enforced at the security-filter level, same
 * pattern as MyPoliciesController for Role.ACKNOWLEDGER.
 */
@RestController
@RequestMapping("/api/v1/auditor")
public class AuditorController {

    private final AuditorService service;

    public AuditorController(AuditorService service) {
        this.service = service;
    }

    @GetMapping("/overview")
    public ResponseEntity<AuditorOverviewResponse> overview() {
        return ResponseEntity.ok(service.overview());
    }

    @GetMapping("/controls")
    public ResponseEntity<List<ControlResponse>> controls() {
        return ResponseEntity.ok(service.controls());
    }

    @GetMapping("/controls/{id}")
    public ResponseEntity<ControlResponse> control(@PathVariable UUID id) {
        return ResponseEntity.ok(service.control(id));
    }

    @GetMapping("/controls/{id}/evidence")
    public ResponseEntity<List<EvidenceResponse>> controlEvidence(@PathVariable UUID id) {
        return ResponseEntity.ok(service.controlEvidence(id));
    }

    @GetMapping("/evidence/{id}/download")
    public ResponseEntity<ByteArrayResource> downloadEvidence(@PathVariable UUID id) {
        AuditorService.DocumentContent doc = service.evidenceDocument(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.filename() + "\"")
                .body(new ByteArrayResource(doc.bytes()));
    }

    @GetMapping("/risk-register")
    public ResponseEntity<List<RiskResponse>> riskRegister() {
        return ResponseEntity.ok(service.riskRegister());
    }

    @GetMapping("/risk-register/download")
    public ResponseEntity<ByteArrayResource> downloadRiskAssessment() {
        byte[] bytes = service.riskAssessmentReport();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/plain;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"soc2-risk-assessment.txt\"")
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @GetMapping("/control-exceptions")
    public ResponseEntity<List<ControlExceptionResponse>> controlExceptions() {
        return ResponseEntity.ok(service.controlExceptions());
    }

    @GetMapping("/policies")
    public ResponseEntity<List<PolicyResponse>> policies() {
        return ResponseEntity.ok(service.policies());
    }

    @GetMapping("/readiness-report")
    public ResponseEntity<ByteArrayResource> readinessReport() {
        byte[] bytes = service.readinessReport();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/plain;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"soc2-readiness-report.txt\"")
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<AuditorRequestResponse>> myRequests() {
        return ResponseEntity.ok(service.listMyRequests());
    }

    @PostMapping("/controls/{id}/requests")
    public ResponseEntity<AuditorRequestResponse> createRequest(@PathVariable UUID id,
                                                                @RequestBody CreateAuditorRequestRequest req) {
        return ResponseEntity.ok(service.createRequest(id, req));
    }

    @GetMapping("/controls/{id}/reviews")
    public ResponseEntity<List<AuditorControlReviewResponse>> controlReviews(@PathVariable UUID id) {
        return ResponseEntity.ok(service.controlReviews(id));
    }

    @PostMapping("/controls/{id}/mark-reviewed")
    public ResponseEntity<AuditorControlReviewResponse> markReviewed(@PathVariable UUID id,
                                                                      @RequestBody MarkControlReviewedRequest req) {
        return ResponseEntity.ok(service.markReviewed(id, req));
    }
}
