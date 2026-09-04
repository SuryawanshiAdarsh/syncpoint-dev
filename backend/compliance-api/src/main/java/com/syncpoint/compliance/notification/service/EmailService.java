package com.syncpoint.compliance.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Thin wrapper around Spring's JavaMailSender. Ships pointed at a local dev SMTP catcher
 * (Mailpit, see docker-compose.yml) by default — swap {@code spring.mail.host} to a real
 * provider (SES/SendGrid/etc.) via env vars for production, same pattern as the LLM/embedding
 * provider switches elsewhere in this codebase.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(JavaMailSender mailSender,
                        @Value("${syncpoint.mail.from:no-reply@syncpoint.local}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    public void sendPasswordResetEmail(String to, String resetLink) {
        send(to, "Reset your Syncpoint password",
                "We received a request to reset your Syncpoint password.\n\n"
                        + "Reset it here (expires in 1 hour): " + resetLink + "\n\n"
                        + "If you didn't request this, you can safely ignore this email.");
    }

    public void sendInviteEmail(String to, String inviterOrgName, String inviteLink) {
        send(to, "You've been invited to " + inviterOrgName + " on Syncpoint",
                "You've been invited to join " + inviterOrgName + " on Syncpoint.\n\n"
                        + "Set up your account here (expires in 7 days): " + inviteLink);
    }

    public void sendVerifyEmail(String to, String verifyLink) {
        send(to, "Verify your Syncpoint email",
                "Please verify your email address to finish setting up your Syncpoint account.\n\n"
                        + "Verify here (expires in 24 hours): " + verifyLink);
    }

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (RuntimeException e) {
            // A down/misconfigured mail server must never fail the calling request (e.g. registration,
            // invite creation) — log loudly so an operator notices, but let the user flow continue.
            log.error("Failed to send email to {} (subject: {}): {}", to, subject, e.getMessage());
        }
    }
}
