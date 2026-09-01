package com.syncpoint.compliance.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncpoint.compliance.ai.dto.AiMappingResult;
import com.syncpoint.compliance.common.exception.ApiException;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.evidence.entity.Evidence;
import com.syncpoint.compliance.evidence.entity.EvidenceVersion;
import com.syncpoint.compliance.evidence.entity.MappingClassification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class AiAnalysisClient {

    private static final Logger log = LoggerFactory.getLogger(AiAnalysisClient.class);

    private final String baseUrl;
    private final boolean enabled;
    private final ObjectMapper mapper;
    private final HttpClient http;
    private final Duration timeout;

    public AiAnalysisClient(@Value("${syncpoint.ai.base-url}") String baseUrl,
                            @Value("${syncpoint.ai.enabled:true}") boolean enabled,
                            @Value("${syncpoint.ai.timeout:PT30S}") Duration timeout,
                            ObjectMapper mapper) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.enabled = enabled;
        this.timeout = timeout;
        this.mapper = mapper;
        this.http = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public AiMappingResult mapEvidence(Control control, Evidence evidence, EvidenceVersion version, byte[] payload) {
        if (!enabled) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_DISABLED", "AI service disabled");
        }
        Map<String, Object> body = new HashMap<>();
        body.put("control", Map.of(
                "code", control.getCode(),
                "title", control.getTitle(),
                "description", control.getDescription(),
                "category", control.getCategory()));
        Map<String, Object> ev = new HashMap<>();
        ev.put("id", evidence.getId().toString());
        ev.put("name", evidence.getName());
        ev.put("sourceType", evidence.getSourceType().name());
        ev.put("sourceSystem", evidence.getSourceSystem());
        ev.put("contentHash", version == null ? null : version.getContentHash());
        ev.put("mimeType", version == null ? null : version.getMimeType());
        if (payload != null && payload.length > 0 && payload.length < 65_536
                && looksTextual(version == null ? null : version.getMimeType())) {
            ev.put("contentPreview", new String(payload, java.nio.charset.StandardCharsets.UTF_8));
        }
        body.put("evidence", ev);

        try {
            String json = mapper.writeValueAsString(body);
            log.info("AI POST /map-evidence url={} bodyLen={}", baseUrl + "/map-evidence", json.length());
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/map-evidence"))
                    .timeout(timeout)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("AI POST /map-evidence status={}", response.statusCode());
            if (response.statusCode() / 100 != 2) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_ERROR",
                        "AI service returned " + response.statusCode() + ": " + safeShort(response.body()));
            }
            JsonNode resp = mapper.readTree(response.body());
            return parse(resp);
        } catch (com.fasterxml.jackson.core.JsonProcessingException je) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "AI_ERROR",
                    "Could not serialize AI request");
        } catch (ApiException ae) {
            throw ae;
        } catch (Exception e) {
            log.warn("AI /map-evidence call failed: {}", e.getMessage());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI_ERROR",
                    "AI service call failed: " + (e.getMessage() == null ? "" : e.getMessage()));
        }
    }

    private static String safeShort(String s) {
        if (s == null) return "";
        return s.length() > 300 ? s.substring(0, 300) : s;
    }

    private AiMappingResult parse(JsonNode r) {
        if (r == null) throw new IllegalStateException("empty response");
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
}
