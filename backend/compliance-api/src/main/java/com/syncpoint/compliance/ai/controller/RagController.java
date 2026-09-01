package com.syncpoint.compliance.ai.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.syncpoint.compliance.ai.client.AiServiceClient;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rag")
public class RagController {

    public record QueryRequest(@NotBlank String query, Integer topK, String framework) { }

    private final AiServiceClient ai;

    public RagController(AiServiceClient ai) {
        this.ai = ai;
    }

    @PostMapping("/query")
    public ResponseEntity<JsonNode> query(@RequestBody QueryRequest req) {
        int topK = req.topK() == null ? 4 : req.topK();
        return ResponseEntity.ok(ai.ragQuery(req.query(), req.framework(), topK));
    }
}
