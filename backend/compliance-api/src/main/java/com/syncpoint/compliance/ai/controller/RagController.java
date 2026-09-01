package com.syncpoint.compliance.ai.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncpoint.compliance.common.exception.ApiException;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rag")
public class RagController {

    private static final Logger log = LoggerFactory.getLogger(RagController.class);

    public record QueryRequest(@NotBlank String query, Integer topK, String framework) { }

    private final String baseUrl;
    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public RagController(@Value("${syncpoint.ai.base-url}") String baseUrl, ObjectMapper mapper) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.mapper = mapper;
    }

    @PostMapping("/query")
    public ResponseEntity<JsonNode> query(@RequestBody QueryRequest req) {
        Map<String, Object> body = new HashMap<>();
        body.put("query", req.query());
        body.put("framework", req.framework() == null ? "SOC2" : req.framework());
        body.put("top_k", req.topK() == null ? 4 : Math.min(10, Math.max(1, req.topK())));
        try {
            String json = mapper.writeValueAsString(body);
            HttpRequest r = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/rag/query"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> resp = http.send(r, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() / 100 != 2) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_ERROR",
                        "AI /rag/query returned " + resp.statusCode());
            }
            return ResponseEntity.ok(mapper.readTree(resp.body()));
        } catch (ApiException apie) {
            throw apie;
        } catch (Exception e) {
            log.warn("RAG proxy failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_ERROR", "AI service call failed");
        }
    }
}
