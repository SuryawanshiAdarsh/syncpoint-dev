package com.syncpoint.compliance.ai.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncpoint.compliance.ai.dto.AiMappingResult;
import com.syncpoint.compliance.common.exception.AiServiceException;
import com.syncpoint.compliance.common.exception.ApiException;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.config.properties.AiProperties;
import com.syncpoint.compliance.evidence.entity.Evidence;
import com.syncpoint.compliance.evidence.entity.EvidenceVersion;
import com.syncpoint.compliance.evidence.entity.MappingClassification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Single HTTP entrypoint for every call to the AI service. */
@Component
public class AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AiServiceClient.class);
    private static final int MAX_PREVIEW_BYTES = 65_536;
    private static final int MAX_ERROR_BODY_CHARS = 300;

    private final AiProperties props;
    private final ObjectMapper mapper;
    private final HttpClient http;

    public AiServiceClient(AiProperties props, ObjectMapper mapper, HttpClient aiHttpClient) {
        this.props = props;
        this.mapper = mapper;
        this.http = aiHttpClient;
    }

    public AiMappingResult mapEvidence(Control control, Evidence evidence, EvidenceVersion version, byte[] payload) {
        ensureEnabled();
        Map<String, Object> body = Map.of(
                "control", controlPayload(control),
                "evidence", evidencePayload(evidence, version, payload));
        return parseMapping(post("/map-evidence", body));
    }

    public JsonNode ragQuery(String query, String framework, int topK) {
        ensureEnabled();
        Map<String, Object> body = Map.of(
                "query", query,
                "framework", framework == null ? "SOC2" : framework,
                "top_k", Math.min(10, Math.max(1, topK)));
        return post("/rag/query", body);
    }

    private void ensureEnabled() {
        if (!props.enabled()) throw AiServiceException.disabled();
    }

    private JsonNode post(String path, Map<String, ?> body) {
        String url = props.normalizedBaseUrl() + path;
        String json;
        try {
            json = mapper.writeValueAsString(body);
        } catch (JsonProcessingException e) {
            throw new AiServiceException("Could not serialize AI request", e);
        }
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(props.timeout())
                .header("Content-Type", "application/json")
                .header("Accept", "application/json");
        String requestId = MDC.get("requestId");
        if (requestId != null) builder.header("X-Request-Id", requestId);
        HttpRequest request = builder
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response;
        try {
            response = http.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (HttpTimeoutException e) {
            throw new AiServiceException("AI service timed out", e);
        } catch (java.io.IOException e) {
            throw new AiServiceException("AI service unreachable: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AiServiceException("AI call interrupted", e);
        }

        log.info("ai POST {} -> {}", path, response.statusCode());
        if (response.statusCode() / 100 != 2) {
            throw new AiServiceException("AI service returned " + response.statusCode() + ": "
                    + safeShort(response.body()));
        }
        try {
            return mapper.readTree(response.body());
        } catch (JsonProcessingException e) {
            throw new AiServiceException("AI service returned malformed JSON", e);
        }
    }

    private Map<String, Object> controlPayload(Control c) {
        Map<String, Object> m = new HashMap<>();
        m.put("code", c.getCode());
        m.put("title", c.getTitle());
        m.put("description", c.getDescription());
        m.put("category", c.getCategory());
        return m;
    }

    private Map<String, Object> evidencePayload(Evidence evidence, EvidenceVersion version, byte[] payload) {
        Map<String, Object> ev = new HashMap<>();
        ev.put("id", evidence.getId().toString());
        ev.put("name", evidence.getName());
        ev.put("sourceType", evidence.getSourceType().name());
        ev.put("sourceSystem", evidence.getSourceSystem());
        ev.put("contentHash", version == null ? null : version.getContentHash());
        ev.put("mimeType", version == null ? null : version.getMimeType());
        String mime = version == null ? null : version.getMimeType();
        if (payload != null && payload.length > 0 && payload.length < MAX_PREVIEW_BYTES && looksTextual(mime)) {
            ev.put("contentPreview", new String(payload, StandardCharsets.UTF_8));
        }
        return ev;
    }

    private AiMappingResult parseMapping(JsonNode r) {
        if (r == null || r.isMissingNode()) {
            throw new AiServiceException("AI service returned empty mapping response");
        }
        MappingClassification classification = null;
        String c = r.path("classification").asText(null);
        if (c != null && !c.isBlank()) {
            try { classification = MappingClassification.valueOf(c); } catch (IllegalArgumentException ignore) { }
        }
        BigDecimal confidence = null;
        if (r.hasNonNull("confidence")) {
            confidence = new BigDecimal(r.get("confidence").asText());
        }
        List<String> supported = new ArrayList<>();
        r.withArray("supported_requirements").forEach(n -> supported.add(n.asText()));
        List<String> missing = new ArrayList<>();
        r.withArray("missing_requirements").forEach(n -> missing.add(n.asText()));

        Map<String, Object> raw = new HashMap<>();
        r.fields().forEachRemaining(e -> raw.put(e.getKey(), asJavaValue(e.getValue())));

        return new AiMappingResult(
                classification, confidence,
                r.path("reason").asText(""),
                supported, missing,
                r.path("recommended_action").asText(""),
                r.path("provider").asText("unknown"),
                r.path("model").asText("unknown"),
                r.path("prompt_version").asText("unknown"),
                raw);
    }

    private static Object asJavaValue(JsonNode n) {
        if (n == null || n.isNull()) return null;
        if (n.isTextual()) return n.asText();
        if (n.isNumber()) return n.numberValue();
        if (n.isBoolean()) return n.asBoolean();
        return n.toString();
    }

    private static boolean looksTextual(String mime) {
        if (mime == null) return false;
        return mime.startsWith("text/") || mime.equals("application/json") || mime.equals("application/xml");
    }

    private static String safeShort(String s) {
        if (s == null) return "";
        return s.length() > MAX_ERROR_BODY_CHARS ? s.substring(0, MAX_ERROR_BODY_CHARS) : s;
    }
}
