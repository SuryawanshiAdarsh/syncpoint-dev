# Integration Architecture

Maps to PROJECT_SPEC §13 (connector interface), §14–17 (per-provider notes),
and PROJECT_SPEC2 §9 (integration model), §10 (lifecycle), §11–14 (per-provider),
§15 (generic interface), §16–17 (test/disconnect).

## 1. Core abstraction

Every provider (GitHub, AWS, Jira, Google Workspace, …) implements the same
Java interface. **The evidence service never talks to a provider directly.**

```java
public interface EvidenceCollector {
    IntegrationProvider getProvider();

    TestResult test(TestContext context);

    List<CollectedItem> collect(CollectionContext context);
}
```

Support types:

```
CollectionContext { organizationId, integrationId, credentialPlaintext,
                    configuration, collectorVersion }

TestContext       { credentialPlaintext, configuration }

CollectedItem     { evidenceType, displayName, description,
                    payload:byte[], mimeType }

TestResult        { ok:boolean, message:string }
```

The `CollectorRegistry` (a `@Component`) auto-wires every `EvidenceCollector`
bean it finds and exposes lookup by `IntegrationProvider` enum. Adding a
provider = adding a class annotated `@Component` that implements the interface.
Nothing else in the codebase needs to change.

## 2. Provider inventory

| Provider          | Status | Auth model         | Evidence collected (MVP)                                     |
|-------------------|:------:|--------------------|---------------------------------------------------------------|
| GitHub            | ✅     | Personal Access Token (fine-grained, read scopes) | Account, repository inventory, branch protection summary       |
| AWS               | ⏳     | Cross-account IAM Role + external id | IAM users/roles, MFA, CloudTrail (planned)         |
| Jira              | ⏳     | OAuth 2.0          | Projects, change-management issues, approvals (planned)       |
| Google Workspace  | ⏳     | OAuth 2.0          | Users, groups, admin status, 2SV status (planned)             |

## 3. Lifecycle state machine

```
     CREATE                DELETE
        │                    ▲
        ▼                    │
    ┌────────┐            ┌───────────────┐
    │PENDING │──test──▶  │ DISCONNECTED  │
    └────────┘            └───────────────┘
        │                    ▲
        │ test OK            │ disconnect
        ▼                    │
    ┌───────────┐            │
    │CONNECTED  │────────────┘
    └───────────┘
        │  test / collect fail
        ▼
    ┌───────────┐
    │  ERROR    │
    └───────────┘
```

Statuses persisted on the `integrations` table: `PENDING`, `CONNECTED`,
`ERROR`, `DISCONNECTED`.

## 4. Credential handling

**Credentials are never persisted in plaintext and never returned via the API.**

The flow:

```
UI: user pastes PAT / token
      │
      ▼
Backend receives it in the request body
      │
      ▼
SecretStore.write(orgId, label, plaintext)
   -> generates a per-record 256-bit DEK
   -> AES-256-GCM encrypts plaintext with DEK  → ciphertext
   -> AES-256-GCM wraps DEK with master key    → wrapped_dek
   -> persists { ciphertext, iv, wrapped_dek } in secret_records
      │
      ▼
Returns a UUID reference; integration row stores only this reference.
```

At collection time:

```
CollectionRunner.executeRun
      │
      ▼
secretStore.read(integration.credentialReference)
      │
      ▼
Passed into CollectionContext.credentialPlaintext (byte[])
      │
      ▼
Collector uses it exclusively for one call; not written to logs.
```

`SECRET_STORE_MASTER_KEY` must be a base-64 32-byte value in production.
If unset, the backend generates an ephemeral in-memory key and **logs a WARN**
so operators cannot ignore it. Ephemeral keys mean secrets do not survive
restart — safe fallback for dev, unsafe for prod.

## 5. Testing a connection

`POST /api/v1/integrations/{id}/test` re-runs the collector's `test()` method:

- 200 OK: `{ ok, provider, message, testedAt }`. Message is user-friendly.
- Rate-limit / auth errors from the provider are caught and mapped to
  short human sentences (§46). Raw provider exceptions never leak.

Both the connect and test endpoints emit `INTEGRATION_TESTED` audit events.

## 6. Collecting evidence

`POST /api/v1/integrations/{id}/collect` performs work off the request thread:

1. Persist a `CollectionRun` row in `QUEUED` state.
2. Emit `COLLECTION_STARTED`.
3. Return HTTP 202 with `{ collectionRunId }`.
4. Async worker (`CollectionRunner.run`) flips status to `RUNNING`, calls
   `collector.collect(...)`, persists each returned item as an `Evidence` +
   `EvidenceVersion` row plus a `CollectionItem` row, and puts the payload
   into MinIO with a tenant-scoped key.
5. Final state: `COMPLETED` / `PARTIAL` / `FAILED` with `COLLECTION_COMPLETED`
   or `COLLECTION_FAILED` audit event.

The runner uses a dedicated `ThreadPoolTaskExecutor` (see `AsyncConfig`) so
long collections cannot starve the HTTP thread pool.

## 7. Disconnect

`DELETE /api/v1/integrations/{id}`:

- Sets `status = DISCONNECTED`.
- Best-effort deletes the `SecretStore` row.
- Nullifies `credential_reference`.
- Emits `INTEGRATION_DISCONNECTED`.

Historical evidence and collection runs are preserved (spec §17): the user
can still export a package that references evidence collected before the
disconnect.

## 8. Adding a new provider

To add e.g. an AWS collector:

1. Add `AWS` to `IntegrationProvider` (already present).
2. Add `AwsIntegrationRequest` DTO to `integrations.dto`.
3. Create `AwsEvidenceCollector implements EvidenceCollector` under
   `integrations/aws/`.
4. Wire an `IntegrationController.connectAws(...)` endpoint that stores the
   IAM role config + external id and (optionally) tests via STS assumeRole.
5. Bump `IntegrationProvider` UI tile in the frontend from "coming soon" to
   an active connect form.

No changes needed to `EvidenceCollector`, `CollectionRunner`,
`CollectorRegistry`, `SecretStore`, or the evidence service.
