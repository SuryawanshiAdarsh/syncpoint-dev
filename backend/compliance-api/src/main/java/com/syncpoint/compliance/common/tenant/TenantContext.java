package com.syncpoint.compliance.common.tenant;

import com.syncpoint.compliance.organization.entity.Role;

import java.util.Optional;
import java.util.UUID;

/** Per-request holder for the authenticated user's tenant context. */
public final class TenantContext {

    public record Principal(UUID userId, UUID organizationId, Role role, String email) {
    }

    private static final ThreadLocal<Principal> HOLDER = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void set(Principal principal) {
        HOLDER.set(principal);
    }

    public static Optional<Principal> current() {
        return Optional.ofNullable(HOLDER.get());
    }

    public static Principal require() {
        Principal p = HOLDER.get();
        if (p == null) {
            throw new IllegalStateException("no tenant context on current thread");
        }
        return p;
    }

    public static void clear() {
        HOLDER.remove();
    }
}
