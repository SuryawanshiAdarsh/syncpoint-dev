package com.syncpoint.compliance.auth.dto;

import com.syncpoint.compliance.organization.entity.Role;

import java.util.UUID;

public record MeResponse(
        UUID userId,
        String email,
        String name,
        UUID organizationId,
        String organizationName,
        Role role,
        boolean onboardingCompleted
) {
}
