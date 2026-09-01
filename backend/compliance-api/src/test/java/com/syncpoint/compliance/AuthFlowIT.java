package com.syncpoint.compliance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AuthFlowIT extends AbstractIntegrationTest {

    @LocalServerPort
    int port;

    @Autowired
    ObjectMapper mapper;

    @Test
    void register_then_login_then_me_flow() throws Exception {
        RestClient client = RestClient.builder().baseUrl("http://localhost:" + port).build();

        // register
        var register = client.post()
                .uri("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "email", "owner@example.com",
                        "password", "very-strong-password",
                        "name", "Owner One",
                        "organizationName", "Acme Compliance"))
                .retrieve()
                .toEntity(String.class);
        assertThat(register.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode tokens = mapper.readTree(register.getBody());
        assertThat(tokens.get("accessToken").asText()).isNotBlank();
        assertThat(tokens.get("refreshToken").asText()).isNotBlank();

        // login
        var login = client.post()
                .uri("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("email", "owner@example.com", "password", "very-strong-password"))
                .retrieve()
                .toEntity(String.class);
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
        String access = mapper.readTree(login.getBody()).get("accessToken").asText();

        // me
        var me = client.get()
                .uri("/api/v1/auth/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + access)
                .retrieve()
                .toEntity(String.class);
        JsonNode meBody = mapper.readTree(me.getBody());
        assertThat(meBody.get("email").asText()).isEqualTo("owner@example.com");
        assertThat(meBody.get("organizationName").asText()).isEqualTo("Acme Compliance");
        assertThat(meBody.get("role").asText()).isEqualTo("OWNER");

        // wrong password rejected
        try {
            client.post()
                    .uri("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("email", "owner@example.com", "password", "wrong-password!"))
                    .retrieve()
                    .toBodilessEntity();
            org.junit.jupiter.api.Assertions.fail("expected 401");
        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized ignored) {
            // expected
        }
    }
}
