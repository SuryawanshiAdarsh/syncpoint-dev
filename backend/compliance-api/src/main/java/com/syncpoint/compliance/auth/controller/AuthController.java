package com.syncpoint.compliance.auth.controller;

import com.syncpoint.compliance.auth.dto.AcceptInviteRequest;
import com.syncpoint.compliance.auth.dto.ForgotPasswordRequest;
import com.syncpoint.compliance.auth.dto.LoginRequest;
import com.syncpoint.compliance.auth.dto.MeResponse;
import com.syncpoint.compliance.auth.dto.RefreshRequest;
import com.syncpoint.compliance.auth.dto.RegisterRequest;
import com.syncpoint.compliance.auth.dto.ResetPasswordRequest;
import com.syncpoint.compliance.auth.dto.TokenResponse;
import com.syncpoint.compliance.auth.dto.VerifyEmailRequest;
import com.syncpoint.compliance.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseEntity.ok(authService.refresh(req));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me() {
        return ResponseEntity.ok(authService.me());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/accept-invite")
    public ResponseEntity<TokenResponse> acceptInvite(@Valid @RequestBody AcceptInviteRequest req) {
        return ResponseEntity.ok(authService.acceptInvite(req));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        authService.verifyEmail(req);
        return ResponseEntity.ok().build();
    }
}
