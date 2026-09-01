package com.syncpoint.compliance.organization.dto;

import com.syncpoint.compliance.organization.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AddMemberRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 1, max = 255) String name,
        @NotBlank @Size(min = 12, max = 200) String password,
        @NotNull Role role
) {
}
