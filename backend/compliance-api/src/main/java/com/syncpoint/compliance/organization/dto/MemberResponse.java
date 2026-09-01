package com.syncpoint.compliance.organization.dto;

import com.syncpoint.compliance.organization.entity.Role;

import java.time.Instant;
import java.util.UUID;

public record MemberResponse(
        UUID id,
        UUID userId,
        String email,
        String name,
        Role role,
        Instant createdAt
) {
}
