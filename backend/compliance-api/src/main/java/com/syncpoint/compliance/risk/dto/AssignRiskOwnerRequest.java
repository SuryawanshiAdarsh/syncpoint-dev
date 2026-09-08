package com.syncpoint.compliance.risk.dto;

import java.util.UUID;

/** Null userId clears ownership. */
public record AssignRiskOwnerRequest(UUID userId) {
}
