package com.syncpoint.compliance.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncpoint.compliance.common.exception.ErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

/** Authenticated but not authorized (e.g. an ACKNOWLEDGER session hitting a blocked endpoint) — 403, not 401. */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper mapper;

    public RestAccessDeniedHandler(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException)
            throws IOException, ServletException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ErrorResponse body = new ErrorResponse(
                Instant.now(),
                HttpStatus.FORBIDDEN.value(),
                "FORBIDDEN",
                "You do not have access to this resource",
                request.getRequestURI());
        mapper.writeValue(response.getOutputStream(), body);
    }
}
