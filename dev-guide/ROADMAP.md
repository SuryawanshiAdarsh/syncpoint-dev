# Syncpoint Roadmap — Where We Are, What's Next, How We Get There

> This document is the master plan. It ties every other planning document together and gives
> a single answer to *"what state is Syncpoint in, and what do we do next?"*.
> If you read only one file in this repo, read this one.

## 1. Companion documents

| Document | Purpose |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layer contracts, tenant invariant, exception hierarchy, config properties, "how to add a new provider" |
| [BUILD-PLAN.md](BUILD-PLAN.md) | Historical build phases 0 → F14 (already delivered) |
| [MVP-COMPLETION-PLAN.md](MVP-COMPLETION-PLAN.md) | Detailed milestone specs M1 → M10 |
| [PATH-TO-FIRST-CUSTOMER.md](PATH-TO-FIRST-CUSTOMER.md) | Non-code gaps between MVP-complete and first paying customer |
| [STATUS.md](STATUS.md) | Current status snapshot (updated per pass) |
| [FRONTEND-ARCHITECTURE.md](FRONTEND-ARCHITECTURE.md) | Frontend-specific patterns |
| [../PRODUCT.md](../PRODUCT.md) | Product explainer for non-technical readers |
| [../PROJECT_SPEC3.md](../PROJECT_SPEC3.md) | MVP completion source of truth |

## 2. Where we are today (2026-09-04)

> **Note on sequencing**: M1 (onboarding gate) and M8 (scheduled collection) were pulled
> forward and shipped out of order relative to §3's dependency chain, and a large amount of
> scope was added that isn't in [MVP-COMPLETION-PLAN.md](MVP-COMPLETION-PLAN.md) at all —
> a Platform Admin Console and a subscription request/approve/reject/revoke workflow. M2–M7,
> M9, M10 remain exactly as specified there. See that file's §1 gap matrix for current status.

### 2.1 What's proven end-to-end

Everything in this list has been demonstrated locally in the current codebase:

- ✅ **Docker compose stack** — 7 services boot healthy in < 30 s
- ✅ **All-in-one appliance** — 1.45 GB single container, boots in ~20 s, 654 MB steady-state memory (not rebuilt since 0.5.1 — likely stale)
- ✅ **Signup, login, JWT** — access + refresh tokens with 15-min / 7-day lifetimes
- ✅ **Multi-tenant isolation** — every tenant-owned query filters by `organizationId`
- ✅ **Role-based access** — OWNER / ADMIN / REVIEWER enforced via `@PreAuthorize`
- ✅ **Evidence upload + versioning** — hashed (SHA-256), versioned (`POST /evidence/{id}/versions`), stored in MinIO with tenant-scoped keys
- ✅ **AI-assisted mapping** — stub LLM proposes classification + confidence; human reviews via Confirm/Reject on control-detail
- ✅ **Dashboard with real data** — coverage %, gaps, recent evidence, integration health, coverage-trend chart
- ✅ **Audit-package export** — ZIP with README, index, per-control folders, audit log
- ✅ **Audit Log Viewer** — dedicated `/audit-log` page over `GET /audit-events`
- ✅ **Activity dashboard** — collection-run history, KPIs, per-run log trail
- ✅ **RAG query** — Qdrant retrieval + LLM synthesis with citations
- ✅ **GitHub PAT collector** — real GitHub API, real branch protection evidence
- ✅ **Onboarding gate (M1)** — persisted `onboarding_completed` flag + route guard, existing orgs backfilled
- ✅ **Scheduled collection (M8)** — tenant-free sweep job, configurable cron, overlap-guarded, schedule picker in Settings
- ✅ **Organization Settings page** — General / Members / Automation, role-gated
- ✅ **Password reset, email verification, invite-by-email** — `auth_tokens` table, local Mailpit catcher
- ✅ **Platform Admin Console** (added, not in original spec) — cross-tenant org list/detail, KPIs, `ROLE_PLATFORM_ADMIN`
- ✅ **Subscription request/approve/reject/revoke workflow** (added, not in original spec) — tenant request form + admin review queue
- ✅ **Cross-service request-ID correlation** — one ID flows backend → AI service in logs
- ✅ **Structured errors** — same `{timestamp, status, code, message, path}` shape from both services
- ✅ **Envelope-encrypted secret store** — AES-256-GCM with a master key
- ✅ **Demo seed** — `demo-owner@syncpoint.local` / `demo-password-2026` produces a fully populated, realistic dashboard (60 evidence, 15+ orgs, ~220 audit events)
- ✅ **Published to Docker Hub** — `syncpoint-{backend,ai-service,frontend}:0.7.0` live, verified byte-identical in an isolated pull-only simulation

### 2.2 What's delivered in code but not yet proven with real inputs

- 🟡 **OpenAI LLM provider** — code exists in `llm.py` but raises `NotImplementedError`
- 🟡 **OpenAI embedding provider** — abstraction exists; real implementation not wired
- 🟡 **Full RAG ingestion** — demo corpus ingests on startup; no `/rag/ingest` endpoint for real docs
- 🟡 **RAG injected into evidence analysis** — retrieval endpoint works; `/map-evidence` doesn't yet call it

### 2.3 What's absent

- 🔴 **GitHub OAuth** (PAT-only today)
- 🔴 **AWS collector** (unavailable in the provider catalog)
- 🔴 **Jira collector** (unavailable)
- 🔴 **Malware scanning** (`MalwareScanner` interface not built)
- 🔴 **Refresh-token revocation** (BUG-009 — reset-password doesn't revoke existing sessions either)
- 🔴 **Breached-password check** (BUG-010)
- 🔴 **AI cost tracking + budget guardrails**
- 🔴 **Automated tests in CI** (backend has some ITs; AI service has none; frontend has none)
- 🔴 **Public deployment** (only local Docker)
- 🔴 **Payment processor** (subscription workflow is manual platform-admin review, no Stripe/billing integration)
- 🔴 **Business, legal, ops layers** — see PATH-TO-FIRST-CUSTOMER.md

### 2.4 Numeric summary

```
Technical MVP:          ███████████░░░░  75 %
Commercial MVP:         ██░░░░░░░░░░░░░  15 %
Trust / posture:        ░░░░░░░░░░░░░░░   0 %
Docs completeness:      ██████████░░░░░  75 %
```

## 3. The whole roadmap in five phases

Phases stack, but items *within* a phase can be parallel where noted.

```
Phase A  →  A.5  →  Phase B  →  Phase C  →  Phase D  →  Phase E
(now)     (UX)     (M1-M10)     (deploy)    (sell)     (scale)
```

### Phase A — Immediate / next 1–2 weeks (before starting M1)

**Goal**: leave the codebase in a "safe to bring another engineer in" state before feature work starts.

| Item | Effort | Reason |
|---|---|---|
| Finish this pass's docs (this doc, DONE) | 0 | Onboarding baseline for anyone joining |
| Get git+GitHub cleanly set up on dev machine (currently no `git` on PATH) | 1 hour | Required to commit |
| Publish `syncpoint-appliance:0.5.1` (currently blocked by Docker Hub network issues on 1 GB layer) | 1 hour retry | Delivery parity with 3-image mode |
| Fix the `X-Request-Id` propagation for the appliance (verified in dev compose; retest on appliance) | 30 min | Already coded; just verify |
| Adopt tiny CI in GitHub Actions (build + smoke test on push) | 1 day | Catches regressions before M1 lands |
| Freeze the ARCHITECTURE.md contracts (already done in this session) | 0 | Reference for M1-M10 work |

**Exit criteria**: repo pushes green to `main`, appliance image is on Docker Hub, another engineer can `git clone && docker compose up -d` and be productive.

### Phase A.5 — Core flows wiring (1 week, between A and B)

**Status: ✅ Done (2026-09-03).** Onboarding gate (M1), dashboard live-refresh, evidence
upload/map/analyze/approve toast+refresh, and control-detail Confirm/Reject all shipped and
verified per the plan below.

**Goal**: make the four core end-to-end flows (onboarding, dashboard, evidence mapping, control detail) *actually* work — click → thing happens → user sees the result.

Detailed in [CORE-FLOWS-WIRING.md](CORE-FLOWS-WIRING.md). Summary:

- **Day 1**: Backend endpoints (organizations/current + onboarding complete, DTO extensions for mappings, DELETE mapping) + onboarding gate wired
- **Day 2**: Dashboard re-fetches on nav-in; evidence upload/map/analyze/approve all toast + refresh
- **Day 3**: Control-detail — mapping type badges, AI Analysis panel, Confirm/Reject buttons, Upload-evidence CTA
- **Day 4**: End-to-end walkthrough, fix regressions, tag `0.6.0`, push

**M1** (onboarding gate from MVP-COMPLETION-PLAN.md) is absorbed by Day 1 of this sprint. Phase B then continues from M2.

**Exit criteria**: a brand-new user can complete signup → onboarding → upload → AI analyze → confirm → see COVERED on the dashboard without asking "did that work?"

### Phase B — MVP completion (weeks 2–8)

**Goal**: deliver everything in [MVP-COMPLETION-PLAN.md](MVP-COMPLETION-PLAN.md).

**Status**: M1 (onboarding gate) and M8 (scheduled collection) are done, pulled forward out of
order. M2–M7, M9, M10 are not started. A large amount of unplanned scope also shipped in this
phase window — Platform Admin Console, subscription request/approve/reject/revoke workflow,
password reset/email verification/invite, evidence versioning, audit log viewer, coverage trend.
None of these substitute for M2–M7 — they don't touch AI quality or new integrations.

Ordered dependency chain:

```
E0 hardening (DONE this pass)
       ↓
M1 Onboarding gate
       ↓
M2 Real LLM (OpenAI)
       ↓
M3 Real embeddings + dim-safe Qdrant
       ↓
M4 RAG ingestion pipeline
       ↓
M5 RAG-powered evidence analysis   ← spec §8 mandatory
       ↓
M6 GitHub OAuth
       ↓
M7 AWS cross-account IAM Role
       ↓
M8 Scheduled collection
       ↓
M9 Jira OAuth + collector
       ↓
M10 Security + AI/RAG eval + E2E + pilot readiness
```

**Verification cadence**: after each milestone, run [../infrastructure/scripts/verify.ps1](../infrastructure/scripts/verify.ps1), do a `docker compose down -v && docker compose up -d` cold-start test, then rebuild + push the affected images with a new tag (`0.6.0` for M1, `0.7.0` for M2, etc.).

**Docker Hub tag plan** (already in MVP-COMPLETION-PLAN.md §5):

> **Actual tags diverged from this plan** — `0.6.0` shipped Core Flows Wiring (not M1 alone) and
> `0.7.0` shipped the Platform Admin Console + subscription workflow + M8 (not M2). M2 has not
> shipped yet. Treat the table below as the *original* forward plan for M2–M10; the next real
> tag continues from `0.7.0` whenever M2 lands, not from a reset.

| Milestone | Tag |
|---|---|
| M1 | 0.6.0 |
| M2 | 0.7.0 |
| M3 | 0.8.0 |
| M4 | 0.9.0 |
| M5 | 0.10.0 |
| M6 | 0.11.0 |
| M7 | 0.12.0 |
| M8 | 0.13.0 |
| M9 | 0.14.0 |
| M10 | 1.0.0-rc1 |

**Skippable-for-first-customer**: ~~M8 (scheduled collection)~~ already shipped; M9 (Jira) can still be done post-first-customer.

**Cannot skip**: M1, M2, M5, M6, M7. These are absolute blockers per PATH-TO-FIRST-CUSTOMER.md §3.

### Phase C — Deployment + ops (weeks 3–5, parallel with late Phase B)

**Goal**: exit local-only, land at `syncpoint.io` over HTTPS with real backups and monitoring.

Detailed in PATH-TO-FIRST-CUSTOMER.md §6 (Weeks 3–5). Summary:

1. Provision VPS (Hetzner / DigitalOcean / Fly), point domain, TLS via Caddy — 1 day
2. Nightly `pg_dump` + `mc mirror` MinIO → S3 — 2 days
3. Sentry + UptimeRobot + Statuspage — 1 day
4. Support inbox + Slack Connect channel template — half day
5. `docs.syncpoint.io` (mkdocs or Docusaurus, pointing at existing markdown) — 3 days
6. Runbook for common issues — 2 days

**Exit criteria**: `https://app.syncpoint.io` boots the appliance, healthchecks pass, backups run nightly, an incident page is publishable.

### Phase D — Sell + first-customer onboarding (weeks 8–12)

**Goal**: contract signed, first tenant lit up, first audit-package delivered to a real auditor.

Detailed in PATH-TO-FIRST-CUSTOMER.md §§4-6. Summary:

1. Legal entity + insurance + MSA + TOS + Privacy + DPA (parallel — start in week 5)
2. Pricing decided, one-pager written, demo script recorded
3. First-customer contract signed
4. Guided onboarding call — manually walk through GitHub + AWS setup
5. First real audit-package export
6. Fix everything that broke; write a case study

**Concurrent** (starts Week 1): Syncpoint's own SOC 2 Type I via Vanta or Drata. Runs 3–4 months in the background.

**Exit criteria**: first invoice sent and paid, customer's auditor accepts the exported package.

### Phase E — Growth + scale (post-first-customer)

**Goal**: reduce founder involvement, add frameworks, prepare for enterprise.

Ordered by leverage, not necessarily by chronology.

1. **Cost tracking** for the AI service — per-tenant LLM cost log + monthly budget guardrail. Blocks runaway costs.
2. **Redis-backed async + rate limiter** — required to run 2+ backend instances.
3. **AI eval harness** (M10 sub-task made permanent) — regression tests for prompt changes.
4. **ISO 27001 framework** — content + prompt-v2 + framework filter in UI. ~2 weeks per framework.
5. **HIPAA framework** — same shape as ISO 27001; content-heavy.
6. **SSO with Okta / Google Workspace** — enterprise blocker.
7. **NgRx / SignalStore on frontend** — cross-page state gets messy without it once the app grows.
8. **Feature flags** — LaunchDarkly or the like; enables "turn on M9 for tenant X but not tenant Y."
9. **Per-tenant DB schemas OR read replicas** — needed past ~500 tenants.
10. **PCI-DSS / GDPR articles / DPDP / privacy audit modes** — depending on customer pull.

**Exit criteria for Phase E**: three paying customers, $10-30k MRR, MVP hardened enough to hire a second engineer, Syncpoint's own SOC 2 Type I complete.

## 4. What we did *not* do this pass (deferred, still on the list)

Recorded here so nothing gets lost:

- **E0.8 frontend UI sweep** — Dashboard / Evidence / Control-detail / Onboarding still have page-local CSS instead of ui-* primitives. Captions are extracted but layouts aren't fully migrated. Cosmetic; low risk.
- **Appliance push to Docker Hub as 0.5.1** — Docker Hub network flakes blocked the push in this session. Retry when Hub is stable.
- **CI on GitHub Actions** — not built. Marked as Phase A.
- **Full frontend test suite** — deferred to M10 / Phase E.
- **A test tenant with real files uploaded to MinIO** — current seed only inserts DB rows; the MinIO objects the seed references don't actually exist. Analyze / download for seeded evidence will `log.warn` and continue. Loading real bytes is a manual step done via the UI.

## 5. Decision log — things we chose and why

Recorded so future contributors don't waste time re-litigating:

| Decision | Reason |
|---|---|
| Two delivery modes (3-image + appliance) | Different customer profiles (cloud pilot vs on-prem / demo) |
| Qdrant dropped from appliance | In-memory fallback exists; saves 150 MB per pull |
| No Kotlin/Scala on backend | Team simplicity; no benefit for this scope |
| No NgRx yet | Signals cover current state complexity; add when a real cross-page flow emerges |
| Envelope encryption over KMS | Portable to on-prem/appliance; can add KMS later behind the same `SecretStore` interface |
| MinIO (not local FS) even in appliance | S3 API parity across dev/appliance/production |
| Postgres 15 (not 16) in appliance | Debian bookworm ships 15; matching version to appliance keeps s6 install clean |
| Captions in TS module, not Angular i18n | i18n adds build complexity; swap later without touching components |
| One master key (not per-tenant) | KISS. Per-tenant keys are a Phase E concern |
| Stub LLM as default | Zero external calls in dev / demo; deterministic tests |

## 6. Success criteria per phase

If any of these is not true at the end of the phase, that phase is not done.

### Phase A (now)
- [ ] `git push` to `main` works from the dev machine
- [ ] `syncpoint-appliance:0.5.1` is on Docker Hub
- [ ] GitHub Actions runs `mvn -B compile` + `docker compose build` on push
- [ ] STATUS.md updated

### Phase B (M1-M10)
- [ ] All checkboxes in [MVP-COMPLETION-PLAN.md §6](MVP-COMPLETION-PLAN.md) ticked
- [ ] `verify.ps1` green on Docker Hub images pinned to `1.0.0-rc1`
- [ ] Signup → OAuth GitHub → collect → analyze with real LLM → export flow verified end-to-end
- [ ] Both delivery modes at `1.0.0-rc1`

### Phase C (deploy)
- [ ] `https://app.syncpoint.io` returns 200
- [ ] TLS cert auto-renews
- [ ] Nightly backup runs and is restorable
- [ ] Statuspage is public
- [ ] Sentry receives a test error

### Phase D (sell)
- [ ] First MSA signed
- [ ] First invoice paid
- [ ] First customer completes onboarding without founder pairing
- [ ] First audit-package accepted by an auditor

### Phase E (growth)
- [ ] Three paying customers
- [ ] Syncpoint's own SOC 2 Type I complete
- [ ] Second engineer productive in < 1 week
- [ ] At least one non-SOC 2 framework live

## 7. When to break the plan

The plan is a scaffold, not scripture. Break it when:

- **A customer commits to buying** with a specific missing feature (Jira, Google Workspace, SSO) → pull that milestone forward, even out of order.
- **Docker Hub / hosting changes** make the delivery model uneconomical → revisit Phase C.
- **A security vulnerability is disclosed** in a dependency → drop everything else.
- **The stub LLM produces plausible enough output that no customer will pay for a real one** → deprioritize M2 in favor of M6/M7 (unlikely, but possible for a very small design partner).

**Do not** break the plan for:
- "It would be cool to add X" without a customer asking
- Refactor urges that don't fix a bug or unlock a milestone
- New framework support before the first framework works end-to-end for a real customer

## 8. Weekly cadence — what to do every week

Regardless of phase:

1. **Monday** — update STATUS.md with what shipped last week, what's this week
2. **Any day** — after each milestone, tag + push Docker images per the tag plan
3. **Friday** — cold-start test both delivery modes (fresh volume + `docker compose up -d`)
4. **End of milestone** — check the milestone off in MVP-COMPLETION-PLAN.md, update this roadmap's §2.1/§2.2/§2.3 lists

## 9. If this is your first day on the project

Read in this order:

1. [../README.md](../README.md) — 2-minute quickstart
2. [../PRODUCT.md](../PRODUCT.md) — what the product does and for whom
3. This document — where we are and where we're going
4. [ARCHITECTURE.md](ARCHITECTURE.md) — how the code is structured
5. [MVP-COMPLETION-PLAN.md](MVP-COMPLETION-PLAN.md) — the milestones you'll be working on
6. [PATH-TO-FIRST-CUSTOMER.md](PATH-TO-FIRST-CUSTOMER.md) — why the code is only 70 % of the job

Then run the stack locally (`docker compose up -d` from repo root), log in as `demo-owner@syncpoint.local` / `demo-password-2026`, and click around every page. The best onboarding is 30 minutes with the running product.

---

*Update this document whenever a phase transitions, a milestone completes, or a decision in §5 is revisited. Every commit that changes the plan should include a diff to this file.*
