package com.syncpoint.compliance.platform.dto;

import jakarta.validation.constraints.Size;

public record RejectSubscriptionRequestRequest(
        @Size(max = 500) String reviewNote
) {
}
