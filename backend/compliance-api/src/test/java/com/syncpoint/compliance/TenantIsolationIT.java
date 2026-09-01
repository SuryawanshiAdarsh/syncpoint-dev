package com.syncpoint.compliance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the critical multi-tenant acceptance criterion from PROJECT_SPEC.md §9:
 * a user in Organization A must NEVER be able to access Organization B data.
 */
class TenantIsolationIT extends AbstractIntegrationTest {

    @LocalServerPort
    int port;

    @Autowired
    ObjectMapper mapper;

    @Test
    void user_in_org_a_cannot_read_org_b_data() throws Exception {
        RestClient client = RestClient.builder().baseUrl("http://localhost:" + port).build();

        String aliceAccess = register(client, "alice@example.com", "very-strong-password", "Alice", "Alpha Corp");
        String bobAccess   = register(client, "bob@example.com",   "very-strong-password", "Bob",   "Beta Corp");

        // Alice sees her own org
        JsonNode aliceOrg = mapper.readTree(client.get()
                .uri("/api/v1/organizations/current")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + aliceAccess)
                .retrieve()
                .body(String.class));
        assertThat(aliceOrg.get("name").asText()).isEqualTo("Alpha Corp");

        // Bob sees his own org
        JsonNode bobOrg = mapper.readTree(client.get()
                .uri("/api/v1/organizations/current")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + bobAccess)
                .retrieve()
                .body(String.class));
        assertThat(bobOrg.get("name").asText()).isEqualTo("Beta Corp");

        // orgs are different
        assertThat(aliceOrg.get("id").asText()).isNotEqualTo(bobOrg.get("id").asText());

        // Alice's members list is only Alice
        JsonNode aliceMembers = mapper.readTree(client.get()
                .uri("/api/v1/organizations/current/members")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + aliceAccess)
                .retrieve()
                .body(String.class));
        assertThat(aliceMembers.isArray()).isTrue();
        assertThat(aliceMembers.size()).isEqualTo(1);
        assertThat(aliceMembers.get(0).get("email").asText()).isEqualTo("alice@example.com");

        // Bob's members list is only Bob (no Alice leakage)
        JsonNode bobMembers = mapper.readTree(client.get()
                .uri("/api/v1/organizations/current/members")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + bobAccess)
                .retrieve()
                .body(String.class));
        assertThat(bobMembers.size()).isEqualTo(1);
        assertThat(bobMembers.get(0).get("email").asText()).isEqualTo("bob@example.com");

        // Unauthenticated call to /current is rejected
        try {
            client.get()
                    .uri("/api/v1/organizations/current")
                    .retrieve()
                    .toBodilessEntity();
            org.junit.jupiter.api.Assertions.fail("expected 401 for unauthenticated");
        } catch (HttpClientErrorException e) {
            assertThat(e.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }
    }

    private String register(RestClient client, String email, String password, String name, String orgName) throws Exception {
        var res = client.post()
                .uri("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("email", email, "password", password, "name", name, "organizationName", orgName))
                .retrieve()
                .body(String.class);
        return mapper.readTree(res).get("accessToken").asText();
    }
}
