package com.syncpoint.compliance.integrations.dto;

import com.syncpoint.compliance.integrations.entity.IntegrationSchedule;
import jakarta.validation.constraints.NotNull;

public record UpdateScheduleRequest(
        @NotNull IntegrationSchedule schedule
) {
}
