package com.syncpoint.compliance.platform.dto;

import java.util.List;

public record AdminOrganizationDetail(
        AdminOrganizationSummary summary,
        List<AdminMemberSummary> members
) {
}
