# Password & Cryptography Policy

> **Starting template.** Customize this document to reflect your organization's actual
> practices before adopting it as policy. This is not legal advice.

## Purpose
Defines minimum requirements for password strength, credential management, and use of
cryptography to protect company and customer data.

## Scope
Applies to all company systems, accounts, and any application or infrastructure component
that stores or transmits confidential data.

## Policy

1. **Password strength.** Where multi-factor authentication (MFA) is not available, passwords
   must meet a minimum length (e.g. 12+ characters) and are checked against known-breached
   password lists where feasible.
2. **MFA.** Multi-factor authentication is required for all systems that support it,
   especially for administrative/privileged access and remote access.
3. **Credential storage.** Passwords are never stored in plaintext; systems must store only
   salted, hashed credentials using a modern algorithm (e.g. bcrypt, scrypt, Argon2).
4. **Secrets management.** API keys, service credentials, and other secrets are stored in a
   dedicated secrets manager or encrypted store, never committed to source control.
5. **Encryption in transit.** All data transmitted over public networks uses TLS 1.2 or
   higher.
6. **Encryption at rest.** Confidential and Restricted data at rest is encrypted using
   industry-standard algorithms (e.g. AES-256).
7. **Key management.** Encryption keys are rotated periodically and access to key material is
   restricted to authorized personnel/systems only.

## Enforcement
Storing secrets in source control or plaintext is a policy violation and must be remediated
immediately upon discovery (including credential rotation).

## Ownership
Owner: _[assign an accountable owner, e.g. Head of Engineering/Security]_
Review cadence: _[e.g. annually]_
