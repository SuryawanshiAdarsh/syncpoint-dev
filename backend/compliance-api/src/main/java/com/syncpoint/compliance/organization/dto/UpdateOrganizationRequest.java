package com.syncpoint.compliance.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateOrganizationRequest(
        @NotBlank @Size(min = 2, max = 255) String name
) {
}
