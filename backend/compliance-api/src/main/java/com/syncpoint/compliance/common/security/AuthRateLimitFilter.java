package com.syncpoint.compliance.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncpoint.compliance.common.exception.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window rate limiter applied to <code>/api/v1/auth/*</code>.
 * <p>
 * Not distributed — one JVM only. Sufficient for MVP; a Redis-backed
 * implementation can slot in later behind the same filter contract.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private final int maxRequests;
    private final long windowMillis;
    private final ObjectMapper mapper;
    private final Map<String, Deque<Long>> buckets = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(@Value("${syncpoint.security.rate-limit.auth-max:20}") int maxRequests,
                               @Value("${syncpoint.security.rate-limit.window-seconds:60}") long windowSeconds,
                               ObjectMapper mapper) {
        this.maxRequests = maxRequests;
        this.windowMillis = windowSeconds * 1000L;
        this.mapper = mapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String p = request.getRequestURI();
        return !(p.equals("/api/v1/auth/login") || p.equals("/api/v1/auth/register"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String key = clientKey(request);
        long now = System.currentTimeMillis();
        Deque<Long> hits = buckets.computeIfAbsent(key, k -> new ArrayDeque<>());
        boolean over;
        synchronized (hits) {
            while (!hits.isEmpty() && hits.peekFirst() < now - windowMillis) {
                hits.removeFirst();
            }
            over = hits.size() >= maxRequests;
            if (!over) hits.addLast(now);
        }
        if (over) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(Math.max(1, windowMillis / 1000)));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ErrorResponse body = new ErrorResponse(
                    Instant.now(), HttpStatus.TOO_MANY_REQUESTS.value(),
                    "RATE_LIMITED", "Too many auth attempts; try again later",
                    request.getRequestURI());
            mapper.writeValue(response.getOutputStream(), body);
            return;
        }
        chain.doFilter(request, response);
    }

    private static String clientKey(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            return comma >= 0 ? xff.substring(0, comma).trim() : xff.trim();
        }
        String real = req.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) return real.trim();
        return req.getRemoteAddr();
    }
}
