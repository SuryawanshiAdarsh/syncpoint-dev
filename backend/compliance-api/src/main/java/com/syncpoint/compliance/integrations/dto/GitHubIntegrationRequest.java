package com.syncpoint.compliance.integrations.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GitHubIntegrationRequest(
        @NotBlank @Size(min = 20, max = 400) String token,
        @Size(max = 128) String displayName
) {
}
