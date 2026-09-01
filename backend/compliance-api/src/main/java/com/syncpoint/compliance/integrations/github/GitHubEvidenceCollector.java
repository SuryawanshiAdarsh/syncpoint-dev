package com.syncpoint.compliance.integrations.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.syncpoint.compliance.integrations.connector.CollectedItem;
import com.syncpoint.compliance.integrations.connector.CollectionContext;
import com.syncpoint.compliance.integrations.connector.EvidenceCollector;
import com.syncpoint.compliance.integrations.connector.TestContext;
import com.syncpoint.compliance.integrations.connector.TestResult;
import com.syncpoint.compliance.integrations.entity.IntegrationProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * GitHub Personal Access Token (PAT) collector.
 * <p>
 * MVP scope: authenticates as a user via PAT and collects:
 * <ol>
 *   <li>Account identity (test evidence)</li>
 *   <li>Repository inventory (up to 100 repos)</li>
 *   <li>Branch protection summary for each collected repo's default branch</li>
 * </ol>
 * Full GitHub App / OAuth flow is future work.
 */
@Component
public class GitHubEvidenceCollector implements EvidenceCollector {

    private static final Logger log = LoggerFactory.getLogger(GitHubEvidenceCollector.class);
    private static final String COLLECTOR_VERSION = "github-pat/1";
    private static final int MAX_REPOS = 25;

    private final ObjectMapper mapper;

    public GitHubEvidenceCollector(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public IntegrationProvider getProvider() {
        return IntegrationProvider.GITHUB;
    }

    @Override
    public TestResult test(TestContext ctx) {
        String token = extractToken(ctx.credentialPlaintext());
        if (token == null || token.isBlank()) return TestResult.fail("Missing token");
        try {
            RestClient client = clientFor(token);
            JsonNode user = client.get().uri("/user").retrieve().body(JsonNode.class);
            if (user == null || !user.has("login")) return TestResult.fail("Unexpected GitHub response");
            return TestResult.ok("Connected as " + user.get("login").asText());
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized e) {
            return TestResult.fail("The token was rejected by GitHub. Regenerate a fine-grained PAT with read scopes.");
        } catch (org.springframework.web.client.HttpClientErrorException.Forbidden e) {
            return TestResult.fail("GitHub blocked the request (rate limit or missing scopes).");
        } catch (Exception e) {
            log.warn("GitHub test failed", e);
            return TestResult.fail("Could not reach GitHub. Check your network and try again.");
        }
    }

    @Override
    public List<CollectedItem> collect(CollectionContext ctx) {
        String token = extractToken(ctx.credentialPlaintext());
        if (token == null || token.isBlank()) {
            throw new IllegalStateException("Missing GitHub token in credential");
        }
        RestClient client = clientFor(token);
        List<CollectedItem> out = new ArrayList<>();

        JsonNode user = client.get().uri("/user").retrieve().body(JsonNode.class);
        out.add(item("GITHUB_ACCOUNT", "GitHub Account",
                "Authenticated GitHub account and public profile", user));

        JsonNode repos = client.get()
                .uri(u -> u.path("/user/repos")
                        .queryParam("per_page", MAX_REPOS)
                        .queryParam("type", "all")
                        .queryParam("sort", "updated")
                        .build())
                .retrieve()
                .body(JsonNode.class);
        out.add(item("GITHUB_REPOSITORY_INVENTORY", "Repository Inventory",
                "Repositories visible to the token holder (up to " + MAX_REPOS + ")", repos));

        ObjectNode protection = mapper.createObjectNode();
        var reposArray = protection.putArray("repositories");
        if (repos != null && repos.isArray()) {
            for (JsonNode repo : repos) {
                String full = repo.path("full_name").asText();
                String defaultBranch = repo.path("default_branch").asText("main");
                ObjectNode row = mapper.createObjectNode();
                row.put("repository", full);
                row.put("default_branch", defaultBranch);
                row.put("private", repo.path("private").asBoolean());
                try {
                    JsonNode p = client.get()
                            .uri("/repos/{full}/branches/{branch}/protection", full, defaultBranch)
                            .retrieve()
                            .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> { /* swallow */ })
                            .body(JsonNode.class);
                    if (p != null && !p.isMissingNode()) {
                        row.set("protection", p);
                        row.put("protected", true);
                    } else {
                        row.put("protected", false);
                    }
                } catch (Exception ex) {
                    row.put("protected", false);
                    row.put("protection_error", ex.getMessage() == null ? "unknown" : ex.getMessage());
                }
                reposArray.add(row);
            }
        }
        out.add(item("GITHUB_BRANCH_PROTECTION", "Branch Protection Overview",
                "Default-branch protection status for each collected repository", protection));

        return out;
    }

    private CollectedItem item(String type, String name, String description, JsonNode payload) {
        byte[] bytes = writeJson(payload);
        return new CollectedItem(type, name, description, bytes, "application/json");
    }

    private byte[] writeJson(JsonNode node) {
        try {
            return mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(node);
        } catch (Exception e) {
            throw new IllegalStateException("json serialize failed", e);
        }
    }

    private static String extractToken(byte[] credential) {
        if (credential == null) return null;
        return new String(credential, StandardCharsets.UTF_8).trim();
    }

    private RestClient clientFor(String token) {
        return RestClient.builder()
                .baseUrl("https://api.github.com")
                .defaultHeader("Accept", "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .defaultHeader("Authorization", "Bearer " + token)
                .defaultHeader("User-Agent", "syncpoint-compliance/" + COLLECTOR_VERSION)
                .build();
    }

    public static String collectorVersion() {
        return COLLECTOR_VERSION;
    }
}
