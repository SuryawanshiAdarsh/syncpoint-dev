package com.syncpoint.compliance.common.exception;

import org.springframework.http.HttpStatus;

/** Upstream failure calling the AI service (network, non-2xx, malformed JSON). */
public class AiServiceException extends ApiException {

    public AiServiceException(String message) {
        super(HttpStatus.BAD_GATEWAY, "AI_ERROR", message);
    }

    public AiServiceException(String message, Throwable cause) {
        super(HttpStatus.BAD_GATEWAY, "AI_ERROR", message, cause);
    }

    public static ApiException disabled() {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_DISABLED", "AI service disabled");
    }
}

