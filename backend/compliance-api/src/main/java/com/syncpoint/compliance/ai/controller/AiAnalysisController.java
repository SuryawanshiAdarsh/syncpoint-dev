package com.syncpoint.compliance.ai.controller;

import com.syncpoint.compliance.ai.entity.AiAnalysis;
import com.syncpoint.compliance.ai.service.AiAnalysisService;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/evidence")
public class AiAnalysisController {

    private final AiAnalysisService service;

    public AiAnalysisController(AiAnalysisService service) {
        this.service = service;
    }

    public record AnalyzeRequest(@NotNull UUID controlId) { }

    @PostMapping("/{id}/analyze")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<Map<String, Object>> analyze(@PathVariable UUID id,
                                                       @RequestBody AnalyzeRequest req) {
        AiAnalysis a = service.analyze(id, req.controlId());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", a.getId(),
                "provider", a.getProvider(),
                "model", a.getModel(),
                "promptVersion", a.getPromptVersion(),
                "classification", a.getClassification() == null ? "" : a.getClassification().name(),
                "confidence", a.getConfidence() == null ? "" : a.getConfidence().toString(),
                "reason", a.getReason() == null ? "" : a.getReason(),
                "result", a.getResult(),
                "createdAt", a.getCreatedAt().toString()));
    }
}
