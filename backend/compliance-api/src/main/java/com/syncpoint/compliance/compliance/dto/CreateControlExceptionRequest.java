package com.syncpoint.compliance.compliance.dto;

import java.time.LocalDate;

public record CreateControlExceptionRequest(String description, LocalDate detectedDate) {
}
