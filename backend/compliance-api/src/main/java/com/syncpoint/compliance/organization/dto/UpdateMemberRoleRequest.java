package com.syncpoint.compliance.organization.dto;

import com.syncpoint.compliance.organization.entity.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(
        @NotNull Role role
) {
}
