package com.syncpoint.compliance.compliance.service;

import com.syncpoint.compliance.compliance.dto.ControlStatus;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Computes per-org control readiness status. F4 will supply the real
 * evidence-mapping-aware implementation; today all controls default to MISSING.
 */
public interface ControlStatusResolver {
    Map<UUID, ControlStatus> statusesFor(UUID organizationId, List<UUID> controlIds);
}
