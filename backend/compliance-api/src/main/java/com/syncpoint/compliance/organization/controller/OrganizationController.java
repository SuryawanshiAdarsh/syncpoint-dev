package com.syncpoint.compliance.organization.controller;

import com.syncpoint.compliance.organization.dto.AddMemberRequest;
import com.syncpoint.compliance.organization.dto.MemberResponse;
import com.syncpoint.compliance.organization.dto.OrganizationResponse;
import com.syncpoint.compliance.organization.dto.UpdateAuditorInfoRequest;
import com.syncpoint.compliance.organization.dto.UpdateComplianceProgramRequest;
import com.syncpoint.compliance.organization.dto.UpdateMemberRoleRequest;
import com.syncpoint.compliance.organization.dto.UpdateOrganizationRequest;
import com.syncpoint.compliance.organization.service.OrganizationService;
import com.syncpoint.compliance.auditor.dto.AuditorRequestResponse;
import com.syncpoint.compliance.auditor.dto.ResolveAuditorRequestRequest;
import com.syncpoint.compliance.auditor.service.AuditorService;
import com.syncpoint.compliance.platform.dto.CreateSubscriptionRequestRequest;
import com.syncpoint.compliance.platform.dto.SubscriptionRequestResponse;
import com.syncpoint.compliance.platform.dto.SubscriptionResponse;
import com.syncpoint.compliance.platform.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/organizations/current")
public class OrganizationController {

    private final OrganizationService organizationService;
    private final SubscriptionService subscriptionService;
    private final AuditorService auditorService;

    public OrganizationController(OrganizationService organizationService, SubscriptionService subscriptionService,
                                  AuditorService auditorService) {
        this.organizationService = organizationService;
        this.subscriptionService = subscriptionService;
        this.auditorService = auditorService;
    }

    @GetMapping
    public ResponseEntity<OrganizationResponse> current() {
        return ResponseEntity.ok(organizationService.current());
    }

    @PatchMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<OrganizationResponse> update(@Valid @RequestBody UpdateOrganizationRequest req) {
        return ResponseEntity.ok(organizationService.updateCurrent(req));
    }

    @PostMapping("/onboarding/complete")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<OrganizationResponse> completeOnboarding() {
        return ResponseEntity.ok(organizationService.completeOnboarding());
    }

    @PatchMapping("/compliance-program")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<OrganizationResponse> updateComplianceProgram(
            @RequestBody UpdateComplianceProgramRequest req) {
        return ResponseEntity.ok(organizationService.updateComplianceProgram(req));
    }

    @PostMapping("/system-description/generate")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> generateSystemDescription() {
        organizationService.generateSystemDescriptionDocument();
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/auditor-info")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<OrganizationResponse> updateAuditorInfo(@RequestBody UpdateAuditorInfoRequest req) {
        return ResponseEntity.ok(organizationService.updateAuditorInfo(req));
    }

    @GetMapping("/members")
    public ResponseEntity<List<MemberResponse>> members() {
        return ResponseEntity.ok(organizationService.listMembers());
    }

    @PostMapping("/members")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<MemberResponse> addMember(@Valid @RequestBody AddMemberRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(organizationService.addMember(req));
    }

    @PatchMapping("/members/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<MemberResponse> updateMemberRole(@PathVariable UUID id,
                                                           @Valid @RequestBody UpdateMemberRoleRequest req) {
        return ResponseEntity.ok(organizationService.updateMemberRole(id, req));
    }

    @DeleteMapping("/members/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> revokeMember(@PathVariable UUID id) {
        organizationService.revokeMember(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/auditor-requests")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<List<AuditorRequestResponse>> auditorRequests() {
        return ResponseEntity.ok(auditorService.listRequestsForOrganization());
    }

    @PostMapping("/auditor-requests/{id}/resolve")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','REVIEWER')")
    public ResponseEntity<AuditorRequestResponse> resolveAuditorRequest(@PathVariable UUID id,
                                                                        @RequestBody ResolveAuditorRequestRequest req) {
        return ResponseEntity.ok(auditorService.resolveRequest(id, req));
    }

    @GetMapping("/subscription")
    public ResponseEntity<SubscriptionResponse> subscription() {
        return ResponseEntity.ok(subscriptionService.current());
    }

    @GetMapping("/subscription/requests")
    public ResponseEntity<List<SubscriptionRequestResponse>> subscriptionRequests() {
        return ResponseEntity.ok(subscriptionService.listRequests());
    }

    @PostMapping("/subscription/requests")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<SubscriptionRequestResponse> requestSubscriptionChange(
            @Valid @RequestBody CreateSubscriptionRequestRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subscriptionService.requestChange(req));
    }

    @PostMapping("/subscription/requests/{id}/revoke")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> revokeSubscriptionRequest(@PathVariable UUID id) {
        subscriptionService.revokeRequest(id);
        return ResponseEntity.noContent().build();
    }
}
