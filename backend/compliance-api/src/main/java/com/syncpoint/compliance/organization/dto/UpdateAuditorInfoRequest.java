package com.syncpoint.compliance.organization.dto;

/** Settings "Auditor / CPA Firm" card -- informational profile fields, distinct from actually
 *  inviting a person as Role.AUDITOR (see AddMemberRequest). */
public record UpdateAuditorInfoRequest(
        String auditorFirmName,
        String auditorContactName,
        String auditorContactEmail
) {
}
