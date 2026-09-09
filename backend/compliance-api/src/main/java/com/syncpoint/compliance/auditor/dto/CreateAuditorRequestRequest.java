package com.syncpoint.compliance.auditor.dto;

import com.syncpoint.compliance.auditor.entity.AuditorRequestType;

public record CreateAuditorRequestRequest(
        AuditorRequestType type,
        String message
) {
}
