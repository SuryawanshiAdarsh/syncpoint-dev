# Security

Maps to PROJECT_SPEC §30–31 (security + file upload), PROJECT_SPEC2 §37
(AI guardrails), §50 (multi-tenancy), §55 (audit logging),
§56 (security requirements), §57 (AI security), §58 (object storage security).

## 1. Threat model at a glance

| Category                     | Primary mitigation                                    |
|------------------------------|--------------------------------------------------------|
| Auth bypass                  | JWT + Spring Security + `@PreAuthorize`               |
| Cross-tenant data leak       | `TenantContext` ThreadLocal + every repo filters by `organization_id` |
| Credential leak              | `SecretStore` envelope encryption + never logged      |
| File upload → RCE            | Ext + MIME allowlist, size cap, no user-controlled paths |
| Path traversal in exports    | Server-generated UUID storage keys                    |
| Prompt injection             | Retrieved context labelled untrusted; classification allowlist |
| Rate abuse on login          | In-memory sliding-window filter on `/auth/*`          |
| Direct API bypass of UI      | Same auth applied to every API endpoint               |

## 2. Authentication

- Passwords hashed with **BCrypt cost 12** (`BCryptPasswordEncoder`).
- **JWT HS256** using `syncpoint.jwt.secret` (min 32 bytes; enforced at
  service construction).
- Access token: 15 minutes. Refresh token: 7 days.
- Claims: `sub` (userId), `email`, `orgId`, `role`, `typ` (`access` /
  `refresh`), `iss`, `iat`, `exp`.
- The filter distinguishes access vs refresh: a refresh token cannot be used
  in an Authorization header (`JwtService.parseAccess` rejects it).

Not yet implemented: refresh-token rotation and revocation. On logout the UI
just discards the token client-side.

## 3. Authorization

- Every non-public endpoint requires authentication (default deny).
- Public: `/auth/register`, `/auth/login`, `/auth/refresh`,
  `/actuator/health*`, `/actuator/info`, `/v3/api-docs`, `/swagger-ui/*`.
- Method-level `@PreAuthorize`:
  - `hasRole('OWNER')` on org PATCH and member role changes.
  - `hasAnyRole('OWNER','ADMIN')` on adding members, connecting/testing/
    collecting/disconnecting integrations, deleting evidence, starting
    exports, downloading exports.
  - `hasAnyRole('OWNER','ADMIN','REVIEWER')` on evidence upload, mapping,
    review, AI analyze.
- 401 for unauthenticated protected calls (custom `RestAuthenticationEntryPoint`
  returns spec §27 JSON, not the default text).
- 403 for authenticated but unauthorized calls.

## 4. Multi-tenancy (V2 §50)

The critical acceptance criterion (V2 §50 last line) is: **a user in
Organization A must never access Organization B**.

Enforcement:

- Backend never trusts a client-supplied organization id. The active org is
  derived exclusively from the JWT and stored in `TenantContext`.
- Repositories used in service code either take `organizationId` explicitly
  (`findByIdAndOrganizationId(...)`) or filter internally (`findByOrganizationId…`).
- The `TenantContext` is cleared in a `finally` block after every request so
  it cannot leak across pooled threads.
- MinIO storage keys are always prefixed with the org id (§58) — even a bug
  that returned a key from another org would fail to fetch its bytes because
  the key wouldn't exist under the caller's prefix.
- Live-verified with a two-user integration test (`TenantIsolationIT`) and by
  hand: Bob's `/organizations/current/members` returns only Bob.

## 5. Secret storage

`SecretStore` interface + `EnvelopeEncryptedSecretStore` implementation
([common/secret/](../../backend/compliance-api/src/main/java/com/syncpoint/compliance/common/secret/)):

- Per-record 256-bit AES data-encryption-key (DEK).
- DEK encrypted with master key (`SECRET_STORE_MASTER_KEY`, base-64 of
  32 bytes) via AES-256-GCM.
- Ciphertext + IV + wrapped DEK stored in `secret_records`.
- Master key is loaded once at startup into JVM memory.
- If the env var is unset, an ephemeral master key is generated and a WARN
  is logged. This is safe for dev (secrets die on restart) and unsafe for
  prod — deploys must set the env var.

Every provider credential (GitHub PAT, future OAuth tokens, etc.) is stored
by reference id on the `integrations.credential_reference` column. **No
plaintext credential appears in any DB column, log line, or API response.**

## 6. Audit logging

All 15 event types from V2 §55 are recorded (`AuditEvents.java` constants):

`LOGIN`, `LOGOUT`, `USER_CREATED`, `USER_ROLE_CHANGED`,
`INTEGRATION_CREATED`, `INTEGRATION_TESTED`, `INTEGRATION_DISCONNECTED`,
`COLLECTION_STARTED`, `COLLECTION_COMPLETED`, `COLLECTION_FAILED`,
`EVIDENCE_CREATED`, `EVIDENCE_REVIEWED`, `EVIDENCE_MAPPED`,
`AI_ANALYSIS_CREATED`, `EXPORT_CREATED`.

The `audit_events` table has a `metadata JSONB` column for per-event
context (e.g. `{"provider":"GITHUB", "ok":true}`). Events are append-only
from the application perspective; there is no update or delete endpoint.

**Never logged** (spec §55 last paragraph):

- Passwords (only the bcrypt hash is ever handled server-side).
- JWTs (interceptors log method+URI, not headers).
- OAuth tokens, AWS credentials, API keys — all live inside `SecretStore`.
- Raw sensitive evidence content — service only logs sizes and hashes.

## 7. Transport & CORS

- HTTPS is expected to be terminated by an upstream reverse proxy
  (Caddy / nginx / Cloudflare). The application listens on plain HTTP
  behind it.
- CORS is env-driven: `CORS_ALLOWED_ORIGINS` (comma-separated patterns,
  wildcards allowed). Dev default: `http://localhost:*,http://127.0.0.1:*`.
  Prod must set the deployed frontend origin explicitly.

## 8. Rate limiting

`AuthRateLimitFilter` applies a sliding-window in-memory bucket per client
IP to `/api/v1/auth/login` and `/api/v1/auth/register`. Default: 20
requests per 60 seconds. Client IP is derived from `X-Forwarded-For` first
(so nginx-proxied traffic is limited per real client), falling back to
`X-Real-IP`, then `RemoteAddr`. 429 responses include `Retry-After` and
the spec §27 error body.

This is a single-JVM implementation. In a multi-instance deploy it becomes
per-instance; swapping to a Redis backend later is a filter-body swap.

## 9. File upload security (V2 §24)

Enforced in `EvidenceService`:

- 50 MB size cap.
- Extension allowlist: `pdf, csv, json, txt, docx, xlsx`.
- MIME allowlist matching the extensions; `application/octet-stream`
  tolerated (browsers/CLIs sometimes send it) and mapped from extension.
- Storage key is server-generated `organizations/{orgId}/evidence/{id}/{versionId}`.
  The user's filename is only kept as evidence display name.
- Executables are impossible because their extensions aren't allowed.

Malware scanning is not yet integrated; the extension + MIME check is a
first line of defence. A `MalwareScanner` hook could be added by wrapping
`storage.put(...)` behind an interface.

## 10. AI guardrails (V2 §37, §57)

Enforced on the AI service:

- Pydantic response schemas (`MapEvidenceResponse` etc.) validate every LLM
  output. Schema violations → HTTP 422, no partial store.
- Classification allowlist: `COVERED / PARTIAL / INSUFFICIENT`. `COMPLIANT`
  or `CERTIFIED` are impossible.
- `field_validator` on the `reason` string rejects phrases like
  "SOC 2 compliant" or "certified" that a misbehaving model might smuggle
  in as prose.
- System prompt is fixed on the server; retrieved context is included in
  the *user* prompt with an explicit "untrusted" label so an injected
  instruction inside a retrieved chunk does not override policy.
- Every AI analysis persisted with `provider`, `model`, and `prompt_version`
  so a suspect result is traceable.
- Human review is required to promote an `AI_SUGGESTED` mapping to
  `HUMAN_CONFIRMED`. AI mappings alone never mark a control `COVERED`.

## 11. Data at rest / in transit

- Backend ↔ Postgres, backend ↔ MinIO, backend ↔ AI service, AI service ↔
  Qdrant: all on the internal Docker network in dev. In prod these should
  each use TLS to the managed equivalents (RDS, S3, managed Qdrant, etc.).
- MinIO uses server-side encryption when configured (out of scope for the
  free bundled MinIO in the demo).
- Postgres in prod should use `sslmode=require`.

## 12. Known deferred security work

- Refresh-token rotation & revocation.
- Password complexity policy beyond the 12-character minimum.
- Password reset flow (forgot-password email).
- SSO / SAML / SCIM.
- Full CSP + strict security headers on frontend (nginx currently sets a
  small baseline set).
- Full test suite re-run against the new backend modules
  (Testcontainers-backed; scaffolding already exists).
