package com.syncpoint.compliance.common.security;

import com.syncpoint.compliance.auth.service.JwtService;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.organization.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER = "Bearer ";
    private static final String MDC_ORG = "orgId";
    private static final String MDC_USER = "userId";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith(BEARER)) {
            chain.doFilter(request, response);
            return;
        }
        String token = header.substring(BEARER.length()).trim();

        Claims claims;
        try {
            claims = jwtService.parseAccess(token);
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("rejected JWT: {}", ex.getMessage());
            chain.doFilter(request, response);
            return;
        }

        try {
            UUID userId = UUID.fromString(claims.getSubject());
            UUID orgId = UUID.fromString(claims.get("orgId", String.class));
            Role role = Role.valueOf(claims.get("role", String.class));
            String email = claims.get("email", String.class);
            boolean platformAdmin = Boolean.TRUE.equals(claims.get("platformAdmin", Boolean.class));

            List<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
            if (platformAdmin) authorities.add(new SimpleGrantedAuthority("ROLE_PLATFORM_ADMIN"));

            var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
            TenantContext.set(new TenantContext.Principal(userId, orgId, role, email, platformAdmin));
            MDC.put(MDC_ORG, orgId.toString());
            MDC.put(MDC_USER, userId.toString());

            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_ORG);
            MDC.remove(MDC_USER);
            TenantContext.clear();
            SecurityContextHolder.clearContext();
        }
    }
}
