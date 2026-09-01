package com.syncpoint.compliance.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 12, max = 200) String password,
        @NotBlank @Size(min = 1, max = 255) String name,
        @NotBlank @Size(min = 2, max = 255) String organizationName
) {
}
