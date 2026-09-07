# Policy Evidence Automation — Market Research & Roadmap

> Companion to [ROADMAP.md](ROADMAP.md) (the master plan) and
> [SETTINGS-AND-SCHEDULED-COLLECTION.md](SETTINGS-AND-SCHEDULED-COLLECTION.md) (the scheduled
> collection framework this plan builds on top of). Captures the PO-level analysis of how the
> market automates policy evidence, where we already stand, and the phased plan to close the gap.

## 1. Why this exists

The product's tagline is "compliance evidence, automated." Policies today are fully built for
the *attestation* half (upload, version, acknowledge, reattest annually, map to controls,
track coverage) but the *automation* half — proving a policy's technical claims are actually
enforced, not just signed — isn't wired up yet, even though the underlying integration
framework to do it already exists. This doc captures the plan to close that gap.

## 2. Market research: how competitors handle this

- **Vanta "Tests" / Drata "Monitors" / Secureframe / Sprinto** all use the same pattern: hundreds
  of pre-built automated checks run hourly/daily against connected systems (AWS/GCP/Azure,
  Okta/Google Workspace, GitHub/GitLab, HR systems). Each test's pass/fail + timestamp + raw API
  response **is** the evidence — refreshed forever, zero manual re-upload. This continuous
  verification is the category's core "always-audit-ready" value proposition.
- **Policy documents are handled separately from technical proof.** None of these platforms claim
  a policy PDF's technical statements ("MFA is required," "changes require peer review") are true
  just because the document was signed. They close that gap by mapping the policy to controls,
  then backing those controls with the automated technical tests above — not by re-reading the
  policy text.
- **What an auditor actually wants**: not "here is the Change Management Policy PDF," but "100%
  of repos require PR review, last checked 6 minutes ago." Live, timestamped, machine-checked.

## 3. Where we already stand (verified against the codebase)

Already built and reusable as-is:

| Capability | Where |
|---|---|
| Collector framework (open/closed for new providers) | `EvidenceCollector` interface, `CollectorRegistry` |
| A real, working collector | `GitHubEvidenceCollector` — pulls branch-protection rules per repo, which is literally the technical proof for a Change Management Policy (control CC8.1) |
| Scheduled, continuous refresh | `ScheduledCollectionSweep` — hourly cron, per-integration `DAILY`/`WEEKLY` schedule |
| Encrypted credential storage | `EnvelopeEncryptedSecretStore` — AES-256-GCM envelope encryption, plaintext never persisted |
| Policy attestation (the "human process" half) | Acknowledgment roster + `PolicyReattestationSweep` (annual reattestation) |
| Policy-to-control mapping | AI-suggested + bulk-confirm + coverage dashboard (built this session), reuses generic `EvidenceControlMapping`/`MappingType` infra |
| Evidence freshness model | `CURRENT` / `EXPIRING` / `EXPIRED`, 90-day TTL for auto-collected evidence, 365-day for manual uploads |
| Gap detection | Review Queue — currently **client-side only**, not policy-aware |

**The gap is not a missing capability** — it's that policy↔control mapping and
integration↔evidence collection don't know about each other yet, and nothing in the UI tells an
admin "you connected GitHub, so your Change Management Policy already has live proof available —
go confirm it."

## 4. Phased plan

### Phase 1 — Wire existing systems together (flagship: GitHub → Change Management)

Zero new integrations. Reuses 100% existing infra. Highest demo value per unit of effort.

1. Add `PolicyAutomationBindings.java` (mirrors the existing `PolicyControlSuggestions` static-map
   pattern) mapping policy **category name** → `IntegrationProvider` + control codes that
   provider's collection already proves + a short human-readable description of what's checked.
   First entry: `"Change Management"` → `GITHUB` → `[CC8.1]` → "Branch protection / required PR
   review enforced on default branches."
2. Extend `PolicyService` with a method to compute each policy's automation status:
   - `NONE` — no binding exists for this category
   - `AVAILABLE` — binding exists, org hasn't connected that provider yet
   - `LIVE` — binding exists AND org has that `Integration` with `status=CONNECTED`
   (include the latest `lastCollectionAt` for a "refreshed X ago" label).
3. Extend `PolicyResponse` / `PolicyDetailResponse` DTOs with this automation status + timestamp.
4. When status is `LIVE` and the collector's most recent run succeeded: auto-create/refresh an
   `AI_SUGGESTED` mapping (reuse existing `EvidenceService.createMapping`) linking the *live
   GitHub evidence item* — not the static policy document — to the same control codes, with a
   reason string like "Automatically verified via GitHub integration — confirm to accept as
   ongoing proof." A human still clicks confirm (same bulk-confirm UI already built) — automation
   supplies the suggestion, never an unreviewed auto-approval.
5. Frontend, Policy Detail page: a small "⚡ Live via GitHub · refreshed 12m ago" badge next to
   Mapped Controls when `LIVE`; "Connect GitHub to auto-verify this policy →" link to
   `/integrations` when `AVAILABLE` but not connected.
6. Frontend, Policies list + Coverage card: a nudge line, e.g. "2 of 5 policies can be
   auto-verified — connect an integration →", to drive integration adoption.

### Phase 2 — New collector: Google Workspace (Access Control + Password Policy)

*Depends on Phase 1's `PolicyAutomationBindings` scaffold existing first.*

Chosen over AWS because one connection lights up **two** new standard categories at once:
Access Control (CC6.1–CC6.3, the single most-tested area in every SOC 2 report) and Password
Policy. AWS's equivalent value (Data Retention + Availability) needs 3+ separate API surfaces
(S3 lifecycle, IAM, backups) for one category's worth of value — worse leverage for the second
collector, so it's Phase 3 instead.

1. New `GoogleWorkspaceEvidenceCollector implements EvidenceCollector` — Admin SDK Directory/
   Reports API via a domain-wide-delegation service account (simpler than a public OAuth consent
   screen for MVP; avoids Google's app-verification review process blocking timeline). Collects
   org-wide 2-Step-Verification enforcement status and password policy settings (min length,
   complexity).
2. Add a connect-form in `integrations.component.ts` (service-account JSON upload — differs from
   GitHub's PAT form) + `IntegrationService.connectGoogleWorkspace(req)`.
3. Add two `PolicyAutomationBindings` entries: `"Access Control"` → `GOOGLE_WORKSPACE` →
   `[CC6.1, CC6.2, CC6.3]`; `"Password Policy"` → `GOOGLE_WORKSPACE` → relevant code(s).
4. The Phase-1 UI badges light up automatically for these categories — no new frontend work
   beyond the connect-form.

### Phase 3 — New collector: AWS (Data Retention + Availability)

S3 lifecycle policies, IAM access review, backup/snapshot retention. Same pattern as Phase 2.
Deliberately deferred behind Phase 2 per the leverage argument above — not skipped.

### Phase 4 — Workflow automation for policies with no technical collector

Vendor Risk, Business Continuity/DR, Risk Assessment, Acceptable Use, Asset Management, and HR
Security can't be technically verified via API. Automate what *can* be automated: migrate the
Review Queue's gap detection from client-side-only to a server-side job that auto-creates a
task/reminder when a policy's mapped evidence is approaching staleness — reusing the existing
`PolicyReattestationSweep` cron pattern and the Review Queue's existing reason-chip taxonomy
(`EXPIRED` / `UNMAPPED` / `EXPIRING` / `LOW_CONFIDENCE`).

## 5. Relevant files

| File | Role |
|---|---|
| `backend/.../policy/service/PolicyControlSuggestions.java` | Pattern to mirror for `PolicyAutomationBindings.java` |
| `backend/.../integrations/connector/EvidenceCollector.java`, `CollectorRegistry.java` | Collector framework — unchanged |
| `backend/.../integrations/github/GitHubEvidenceCollector.java` | Reference implementation + Phase 2 template |
| `backend/.../integrations/service/ScheduledCollectionSweep.java`, `CollectionRunner.java` | Scheduling/refresh — unchanged |
| `backend/.../policy/service/PolicyService.java` | Add automation-status computation |
| `backend/.../policy/dto/PolicyResponse.java`, `PolicyDetailResponse.java` | Add automation fields |
| `frontend/.../features/policies/policy-detail.component.ts`, `policies.component.ts` | Badges/nudges |
| `frontend/.../features/integrations/integrations.component.ts` | Phase 2 connect-form |
| `frontend/.../features/review-queue/review-queue.component.ts` | Phase 4 server-side migration target |

## 6. Decisions made (and why)

| Decision | Reasoning |
|---|---|
| Reuse `MappingType.AI_SUGGESTED` for automated live-evidence suggestions instead of a new enum value | Keeps the confirm/reject UI already built working unchanged — a human still confirms, automation only supplies and refreshes the suggestion. |
| Google Workspace via domain-wide-delegation service account, not public OAuth consent, for MVP | Avoids Google's app-verification review process blocking the timeline. |
| AWS explicitly deferred to Phase 3, not skipped | Still valuable — just worse leverage as the *second* collector than Google Workspace. |

## 7. Open questions before Phase 1 build starts

1. Should the "Connect GitHub to auto-verify" nudge be visible to all roles, or OWNER/ADMIN only?
   Recommend OWNER/ADMIN only — matches who can already manage integrations today.
2. Phase 2's service-account approach requires the customer's Google Workspace super-admin to
   grant domain-wide delegation manually (a short setup checklist, not code) — worth writing a
   one-page setup guide alongside the collector.
