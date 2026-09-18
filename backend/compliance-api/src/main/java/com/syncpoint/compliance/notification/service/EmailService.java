package com.syncpoint.compliance.notification.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

/**
 * Thin wrapper around Spring's JavaMailSender. Ships pointed at a local dev SMTP catcher
 * (Mailpit, see docker-compose.yml) by default — swap {@code spring.mail.host} to a real
 * provider (SES/SendGrid/etc.) via env vars for production, same pattern as the LLM/embedding
 * provider switches elsewhere in this codebase.
 * <p>
 * Sends multipart (plain text + HTML) rather than plain-text-only: a bare long URL in a
 * plain-text body is vulnerable to MTA/line-wrap corruption (a soft line break landing inside
 * the token silently breaks the link) once real SMTP relays are involved — Mailpit doesn't
 * exhibit this, which is why it only surfaces after switching to a real provider. The HTML
 * part's {@code <a href>} keeps the URL as one attribute value, immune to text wrapping.
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
                        + "If you didn't request this, you can safely ignore this email.",
                "<p>We received a request to reset your Syncpoint password.</p>"
                        + "<p><a href=\"" + resetLink + "\">Reset your password</a> (expires in 1 hour)</p>"
                        + "<p>If you didn't request this, you can safely ignore this email.</p>");
    }

    public void sendInviteEmail(String to, String inviterOrgName, String inviteLink) {
        send(to, "You've been invited to " + inviterOrgName + " on Syncpoint",
                "You've been invited to join " + inviterOrgName + " on Syncpoint.\n\n"
                        + "Set up your account here (expires in 7 days): " + inviteLink,
                "<p>You've been invited to join <strong>" + inviterOrgName + "</strong> on Syncpoint.</p>"
                        + "<p><a href=\"" + inviteLink + "\">Set up your account</a> (expires in 7 days)</p>");
    }

    public void sendVerifyEmail(String to, String verifyLink) {
        send(to, "Verify your Syncpoint email",
                "Please verify your email address to finish setting up your Syncpoint account.\n\n"
                        + "Verify here (expires in 24 hours): " + verifyLink,
                "<p>Please verify your email address to finish setting up your Syncpoint account.</p>"
                        + "<p><a href=\"" + verifyLink + "\">Verify your email</a> (expires in 24 hours)</p>");
    }

    public void sendPolicyAcknowledgmentEmail(String to, String policyTitle, String portalLink) {
        send(to, "Please acknowledge: " + policyTitle,
                "Your organization has published or updated a policy that requires your acknowledgment.\n\n"
                        + "Policy: " + policyTitle + "\n\n"
                        + "Review and acknowledge it here: " + portalLink,
                "<p>Your organization has published or updated a policy that requires your acknowledgment.</p>"
                        + "<p>Policy: <strong>" + policyTitle + "</strong></p>"
                        + "<p><a href=\"" + portalLink + "\">Review and acknowledge it</a></p>");
    }

    public void sendAuditorRequestEmail(String to, String controlCode, String message, String link) {
        send(to, "Your auditor requested something on " + controlCode,
                "Your auditor is reviewing " + controlCode + " and left this request:\n\n"
                        + message + "\n\n"
                        + "Respond here: " + link,
                "<p>Your auditor is reviewing <strong>" + controlCode + "</strong> and left this request:</p>"
                        + "<blockquote>" + message + "</blockquote>"
                        + "<p><a href=\"" + link + "\">Respond here</a></p>");
    }

    private void send(String to, String subject, String plainText, String html) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(plainText, html);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            // A down/misconfigured mail server must never fail the calling request (e.g. registration,
            // invite creation) — log loudly so an operator notices, but let the user flow continue.
            log.error("Failed to send email to {} (subject: {}): {}", to, subject, e.getMessage());
        }
    }
}
