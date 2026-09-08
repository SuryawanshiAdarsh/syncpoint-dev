package com.syncpoint.compliance.compliance.dto;

import java.util.UUID;

/** Null userId clears ownership. */
public record AssignControlOwnerRequest(UUID userId) {
}
