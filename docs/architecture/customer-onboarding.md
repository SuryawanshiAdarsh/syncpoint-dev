# Customer Onboarding

Maps to PROJECT_SPEC2 §7 (signup), §8 (wizard), §64 (end-to-end
acceptance test), and §72 (first-real-product-demo target).

## 1. Goals

> A new customer should reach their first useful evidence result in roughly
> 15 minutes or less. (V2 §72)

The onboarding flow is designed to be walked front-to-back by a single OWNER
without help.

## 2. The five-step wizard (V2 §8)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Welcome                                    │
│  Explain what the product does; note that AI is advisory.           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Select framework                                 │
│  SOC 2 is auto-selected in MVP (only framework currently seeded).   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Connect your systems                             │
│                                                                     │
│  GitHub  ✓ (available now, via fine-grained PAT)                    │
│  AWS     ⏳ (coming soon)                                           │
│  Jira    ⏳ (coming soon)                                           │
│  Google  ⏳ (coming soon)                                           │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Run first collection                             │
│  "Collect now" on GitHub creates a run; evidence appears in seconds.│
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Coverage snapshot                                │
│  Dashboard shows Covered / Partial / Missing / Needs Review counts. │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Sign-up flow in detail

1. **User submits** `{email, password (min 12), name, organizationName}` to
   `POST /api/v1/auth/register`.
2. **Backend** creates in a single transaction:
   - `Organization` (auto-generated slug),
   - `User` (BCrypt hash, cost 12),
   - `OrganizationMember` with role `OWNER`.
3. **Backend** emits two audit events:
   - `USER_CREATED`
   - `LOGIN`
4. **Backend** returns `TokenResponse` (access + refresh + `Bearer` +
   `expiresIn`) with HTTP 201.
5. **Frontend** persists tokens in `localStorage` via `TokenStore` and
   navigates to `/onboarding`.

Only the first user of an organization becomes OWNER. Subsequent members are
added by OWNER/ADMIN through `POST /organizations/current/members` with an
explicit role.

## 4. Integration connect flow (GitHub PAT)

1. UI: OWNER/ADMIN pastes a fine-grained PAT and a display name.
2. Frontend `POST /api/v1/integrations/github { token, displayName }`.
3. Backend:
   - Deletes any prior GITHUB integration for the org (only one allowed per
     provider in MVP).
   - Creates `Integration(status=PENDING, provider=GITHUB)`.
   - Writes the token via `SecretStore.write(orgId, "github-pat/{id}", …)`;
     stores the returned reference id, not the plaintext.
   - Emits `INTEGRATION_CREATED` audit event.
   - Eagerly runs a `GitHubEvidenceCollector.test(...)` — calls `/user` on
     GitHub. Sets status to CONNECTED or ERROR based on result.
   - Emits `INTEGRATION_TESTED`.
   - Returns the sanitised `IntegrationResponse` (no secret).

Secrets never appear in an API response. Secrets are wiped on disconnect and
credentials are re-derived from the reference id every collection.

## 5. First-collection flow

Triggered by the UI's "Collect now" button (or `POST /integrations/{id}/collect`):

```
UI  ─▶  IntegrationController.collect(id)
         │
         ▼
     IntegrationService.triggerCollection
         │  (persists CollectionRun QUEUED, emits COLLECTION_STARTED)
         ▼
     CollectionRunner.run(runId, integrationId)  [ @Async ]
         │
         │  1. resolve integration + credential (via SecretStore)
         │  2. collector.collect(context) — real HTTP calls to provider
         │  3. for each CollectedItem:
         │       - create Evidence row
         │       - MinIO put with tenant-scoped key
         │       - EvidenceVersion row with sha256 + size
         │       - CollectionItem row (SUCCESS / FAILED)
         │  4. update Integration.lastCollectionAt
         │  5. persist CollectionRun status (COMPLETED / PARTIAL / FAILED)
         │  6. emit COLLECTION_COMPLETED / COLLECTION_FAILED
         ▼
     Client polls GET /collections/{id}
```

## 6. What onboarding does NOT do (yet)

- No org-invite email flow. OWNER manually adds members with a password
  they must communicate out-of-band.
- No SSO / SAML.
- No scheduled recurring collection — only manual runs in MVP (the schedule
  column exists in the schema).
- No password reset — a lost password requires manual DB update or a
  future self-service flow.
