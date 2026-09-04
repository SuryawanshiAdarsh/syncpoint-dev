package com.syncpoint.compliance.platform.controller;

import com.syncpoint.compliance.platform.dto.AdminSubscriptionRequestResponse;
import com.syncpoint.compliance.platform.dto.RejectSubscriptionRequestRequest;
import com.syncpoint.compliance.platform.service.SubscriptionRequestAdminService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Platform-admin review queue for tenant subscription (plan/seat) change requests. */
@RestController
@RequestMapping("/api/v1/admin/subscription-requests")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class SubscriptionRequestAdminController {

    private final SubscriptionRequestAdminService service;

    public SubscriptionRequestAdminController(SubscriptionRequestAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminSubscriptionRequestResponse> list(@RequestParam(defaultValue = "PENDING") String status) {
        return "ALL".equalsIgnoreCase(status) ? service.listAll() : service.listPending();
    }

    @PostMapping("/{id}/approve")
    public AdminSubscriptionRequestResponse approve(@PathVariable("id") UUID id) {
        return service.approve(id);
    }

    @PostMapping("/{id}/reject")
    public AdminSubscriptionRequestResponse reject(@PathVariable("id") UUID id,
                                                    @Valid @RequestBody RejectSubscriptionRequestRequest req) {
        return service.reject(id, req);
    }
}
