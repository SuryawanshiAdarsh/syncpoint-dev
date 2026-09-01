package com.syncpoint.compliance.organization.controller;

import com.syncpoint.compliance.organization.dto.AddMemberRequest;
import com.syncpoint.compliance.organization.dto.MemberResponse;
import com.syncpoint.compliance.organization.dto.OrganizationResponse;
import com.syncpoint.compliance.organization.dto.UpdateMemberRoleRequest;
import com.syncpoint.compliance.organization.dto.UpdateOrganizationRequest;
import com.syncpoint.compliance.organization.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
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
}
