package com.syncpoint.compliance.policy.dto;

import java.util.List;

public record PolicyPortalPageResponse(
        List<PolicyPortalItemResponse> items,
        int page,
        int size,
        long totalItems,
        int totalPages
) {
}
