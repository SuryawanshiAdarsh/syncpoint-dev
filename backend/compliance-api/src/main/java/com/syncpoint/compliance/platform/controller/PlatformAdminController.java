package com.syncpoint.compliance.platform.controller;

import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.platform.dto.AdminOrganizationDetail;
import com.syncpoint.compliance.platform.dto.AdminOrganizationSummary;
import com.syncpoint.compliance.platform.dto.UpdateSubscriptionRequest;
import com.syncpoint.compliance.platform.service.PlatformAdminService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Internal, Syncpoint-employee-only console for monitoring customer plan/status/usage/expiry
 * across every tenant. Never reachable by ordinary tenant users: every endpoint requires the
 * orthogonal {@code ROLE_PLATFORM_ADMIN} authority in addition to normal authentication.
 */
@RestController
@RequestMapping("/api/v1/admin/organizations")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class PlatformAdminController {

    private final PlatformAdminService platformAdminService;

    public PlatformAdminController(PlatformAdminService platformAdminService) {
        this.platformAdminService = platformAdminService;
    }

    @GetMapping
    public List<AdminOrganizationSummary> listOrganizations() {
        return platformAdminService.listOrganizations();
    }

    @GetMapping("/{id}")
    public AdminOrganizationDetail getOrganization(@PathVariable("id") UUID id) {
        return platformAdminService.getOrganization(id);
    }

    @PatchMapping("/{id}/subscription")
    public AdminOrganizationSummary updateSubscription(@PathVariable("id") UUID id,
                                                        @Valid @RequestBody UpdateSubscriptionRequest request) {
        UUID actorUserId = TenantContext.require().userId();
        return platformAdminService.updateSubscription(id, actorUserId, request);
    }
}
