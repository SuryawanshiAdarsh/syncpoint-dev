# SOC 2 Readiness — Prioritized Backlog

> **Purpose**: single pick-list for future implementation. Every "parked / deferred / future
> work / not yet fixed / logged for later / coming soon" item from the rest of `dev-guide/` is
> consolidated here. When planning a sprint, pull the next thing off the top of this table.
>
> **Priority**: P0 = blocks first-customer confidence · P1 = needed to close deal #1 ·
> P2 = strengthens Type II / renewal · P3 = defer past customer #1.
>
> **Effort**: S ≈ ≤2 days · M ≈ 3-10 days · L ≈ >10 days. Rough, for sequencing only.

| # | Gap | Impact | Effort | Priority | Sequencing note |
|---|---|---|---|:---:|---|
| 1 | **Real CC1-CC9 control catalog** (5 categories missing entirely; CC8.2 fabricated) | High — coverage % is meaningless without it | M | **P0** | Do first; every downstream feature (policies, readiness report, integrations) maps to these control codes |
| 2 | **Policy Management Module — MVP** (upload/version/ack tracking + 4 starter policies: InfoSec, Access Control, Incident Response, Change Mgmt) | High — CC1/CC2/CC5/CC9.2 permanently blank without it | M | **P0** | Runs in parallel with #1; depends on #1's control codes for mapping |
| 3 | **Own security hygiene fixes** — revert CORS wildcard; BUG-009 refresh-token revocation on password reset; BUG-010 breached-password check | High — security-literate buyer walks if they find these | S | **P0** | Half-day work; anytime before any non-demo deployment |
| 4 | **Legal/business layer** — entity, MSA/TOS/DPA, insurance | High — can't invoice customer #1 regardless of product | M | **P0** | Non-eng track, runs in parallel. Already scoped in `BUSINESS.md` / `LEGAL.md` |
| 5 | **Persistent `SECRET_STORE_MASTER_KEY`** (vault-provided, not boot-generated fallback) + rotation docs | High — production secret store silently regenerates on restart without a persistent key, orphaning every stored credential | S | **P0** | From `PATH-TO-FIRST-CUSTOMER.md` §3.1 |
| 6 | **Full standard SOC 2 policy set** (Vendor Mgmt, Data Retention, BCP/DR, Acceptable Use, Risk Mgmt, HR Security) + **explicit policy → CC mapping** on dashboard | High — without mapping, #2 doesn't move any control from MISSING to COVERED | M | **P1** | Depends on #1 and #2 |
| 7 | **IdP/SSO integration** (Google Workspace reuses existing enum, or Okta) | High — covers CC6.1/6.2/6.3/6.6, single biggest integration lever | M | **P1** | Bigger gap than AWS; do before AWS unless customer #1's stack forces otherwise |
| 8 | **Subservice-organization tracking** (customer's AWS/GCP SOC 2 report on file + expiry alerts) | Medium — cheap, closes CC9.2 concretely, every cloud customer needs it | S | **P1** | Standalone |
| 9 | **Honest Readiness / Gap Report export** (artifact a customer hands their CPA firm to start scoping) | High — makes the sales conversation concrete instead of abstract | M | **P1** | Depends on #1 |
| 10 | **Type I readiness framing** on dashboard (label point-in-time coverage honestly; do not imply operating-effectiveness) | Medium — sets correct expectations, avoids over-claiming | S | **P1** | Standalone |
| 11 | **Versioned legal-document acceptance tracking** (BUG-005) — which TOS/DPA/Privacy version each org accepted, when | Medium-High — gates real customer contracts, expected by any procurement team | M | **P1** | Complements #4 |
| 12 | **BUG-003 SOC 2 badge hardcoded** — should read from org's active framework(s), not the literal `SOC 2 (DEMO)` | Medium — becomes a false compliance claim the moment we ship any non-SOC-2 framework | S | **P1** | Ship with #6 or earlier |
| 13 | **Rate limiting beyond `/auth/*`** — extend `AuthRateLimitFilter` pattern to `/evidence/upload` and `/rag/query` | Medium — abuse surface today | S | **P1** | From `PATH-TO-FIRST-CUSTOMER.md` §3.2 |
|   | **— Org onboarding / SOC 2 kickoff wizard —** | | | | current 5-step onboarding is a product tour, not a SOC 2 kickoff; the six items below capture what a real kickoff needs per AICPA / Linford readiness-assessment guidance |
| 14 | **Scope selector — Trust Services Categories** (Security mandatory + optional Availability / Confidentiality / Processing Integrity / Privacy). Stored per org; drives which controls appear in the catalog | High — a coverage % against undefined scope is meaningless to an auditor | S | **P1** | Depends on #1 |
| 15 | **Type I vs Type II selector + observation-period fields** (start / end / target report date). Drives whether dashboard shows point-in-time coverage (#10) or Type II clock (#20) | High — currently the product implicitly presents Type-I framing without ever asking | S | **P1** | Depends on #10 |
| 16 | **System description module** — structured template ("services provided", "system boundaries", "components", "subservice orgs") the customer fills in. Becomes an evidence artifact of its own | High — AICPA requires a system description in the final SOC 2 report; nothing produces it today | M | **P1** | Complements #8 (subservice) and #9 (readiness report) |
| 17 | **Control-owner assignment** — pick a user as the owner of each control category (CC1, CC6, CC7, etc.). Shown on control-detail; drives future review-reminder emails | High — every auditor asks "who owns this control" in Round 1 | S | **P1** | Depends on #1 |
| 18 | **Auditor / CPA firm field** on org profile — informational now, hook for future auditor-portal work | Low — informational; unblocks pilot conversations | S | **P2** | Standalone |
| 19 | **Company profile fields** (employee count, HR onboarding process, contractor use, entity type) — auditor Round-1 answers collected in one form | Low — one-form save, reused across multiple future controls | S | **P2** | Standalone |
| 20 | **Type II readiness clock** — consecutive-days-covered per control, built on existing `control_status_snapshots` | High for Type II customers, low for Type I first-timers | M | **P2** | Infrastructure already exists — just needs framing, query, UI. Made honest by #15 |
| 21 | **Policy annual-review-cycle staleness** + **acknowledgment wired to HRIS integration** | Medium — closes the loop between policies and joiners/leavers | M | **P2** | Depends on #2, #6, and HRIS wave |
| 22 | **GitHub collector extension** (Actions required-reviewers + Dependabot alerts) | Medium — cheap win, closes CC8.1 / CC7.1 gaps | S | **P2** | No new integration; extends existing collector |
| 23 | **Vulnerability management integration** (Snyk) | Medium — CC7.1, CC9.1 | M | **P2** | |
| 24 | **Real LLM (M2) + real embeddings (M3) + RAG-connected analysis (M4/M5)** | Medium — moves AI from demo-quality to production-quality classification | L | **P2** | Not needed for customer #1 if stub is honestly framed as "AI suggestion" |
| 25 | **AWS collector (M7)** | Medium — CC6.1/6.7, A1.1/1.2, CC7.1 in one connector | M | **P2** | **Promote to P1 if customer #1 is AWS-heavy** |
| 26 | **Incident management integration** (PagerDuty; Jira separately planned as M9) | Medium — CC7.2 | M | **P2** | |
| 27 | **Freshness expiry auto-transitions** — currently computed at read time; a background sweep would emit `EVIDENCE_EXPIRED` audit events at the right moment | Low-Medium — read-time is functionally correct but audit trail lags | S | **P2** | |
| 28 | HRIS (Rippling/BambooHR), Endpoint/MDM (Jamf/Kandji/Intune), Backup/DR, Availability monitoring (StatusPage/Pingdom) | Low-Medium — completes CC6.2 offboarding, A1 continuity | L | **P3** | AWS collector will absorb backup/availability sub-items |
| 29 | GitHub OAuth App upgrade (PAT is fine for MVP) · Jira collector (M9) · GCP/Azure equivalents · Secrets mgmt (1Password/Vault) | Low — niche or already-workable-with-existing | L | **P3** | |
| 30 | E2E test suite, AI/RAG eval harness, real malware scanning, SSO/SAML (M10 hardening) | Low for customer #1, high for #2/#3 | L | **P3** | Ship for pilot readiness once revenue exists |
| 31 | AI cost tracking + budget guardrails | Low until #24 lands and real spend exists | S | **P3** | |
| 32 | **BUG-004 `(DEMO)` label hardcoded** — should be driven by env/deployment flag | Low — cosmetic, wrong text on a real prod deploy | S | **P3** | |
| 33 | **BUG-007 Notification/digest emails** — nothing proactively alerts on expiring evidence / failed collections / weekly coverage delta | Low — nice automation | M | **P3** | Mailpit + Spring Mail already wired for reset/invite/verify — reuse |
| 34 | **BUG-008 Bulk actions for mapping/evidence review** — one-row-at-a-time only | Low — throughput nice-to-have | M | **P3** | Revisit when a reviewer complains |
| 35 | **CurrentUserService caching** — `GET /auth/me` re-fetched by ~4 guards/components per session, no `shareReplay` | Low — no user-visible symptom yet | S | **P3** | From `ARCHITECTURE.md` §19 |
| 36 | **CI on GitHub Actions** — build + smoke test on push | Low for pilot, mandatory before hiring engineer #2 | M | **P3** | From `ROADMAP.md` §4 |
| 37 | **Frontend UI sweep** — Dashboard / Evidence / Control-detail / Onboarding still have page-local CSS instead of `ui-*` primitives | Low — visual consistency | M | **P3** | From `ROADMAP.md` §4 / `FRONTEND-ARCHITECTURE.md` |
| 38 | **Test tenant with real MinIO files** — current seed inserts DB rows only; download/analyze on seeded evidence logs a warn | Low — dev quality, not customer-facing | S | **P3** | From `ROADMAP.md` §4 |
| 39 | **Password rotation policy** + expiry | Low — real customer eventually asks | M | **P3** | Companion to BUG-009 in #3 |
| 40 | **Additional frameworks** (ISO 27001, HIPAA, DPDP, GDPR) — content + framework-scoped prompt version + framework filter in UI | Low pre-first-customer, leverage post | L | **P3** | ~2 weeks per framework once #1 is done and validated |
| 41 | **Stripe / payment-processor billing** — subscription workflow today is manual platform-admin approve/reject; no invoice, no card charge | Low — manual invoicing is fine for customers #1-3 per `BUSINESS.md` §5 | M | **P3** | Trigger at customer #4 |
|   | **— Market-validated gaps (added after Vanta / AICPA competitive review, 2026-09-05) —** | | | | features category leaders ship that we hadn't yet planned |
| 42 | **Trust Center** — public/shareable page showing the customer's SOC 2 report, subprocessor list, security docs, policy list, real-time control status | High — biggest sales-cycle accelerator in the category; every serious SOC 2 buyer expects it | M | **P1** | Depends on #2/#6 (policies), #8 (subservice), #9 (readiness report). Prospect-facing surface, not tenant-internal |
| 43 | **Risk assessment workflows** (CC3.x) — risk register with owner/likelihood/impact/mitigation + review cadence, produces a downloadable risk-assessment artifact | High — auditor asks "show me your risk register" Round 1; #1's CC3 catalog rows don't produce this on their own | M | **P1** | Depends on #1 (needs CC3 codes) |
| 44 | **Access review workflows** (CC6.3) — quarterly "review who has access" workflow: assign reviewer per system, capture confirmations, evidence artifact | High — every SOC 2 report tests this control; distinct from #7 (which collects who-has-access), this is the periodic-review action on top | M | **P1** | Depends on #7 (IdP) for the "who has access" data feed |
| 45 | **Vendor / Third-Party Risk Management (TPRM)** — vendor inventory, per-vendor risk classification, security-questionnaire tracking, contract-expiry alerts | Medium — CC9.2 is broader than #8 (subservice orgs); every vendor (payroll, monitoring, email, etc.) has to be inventoried | M | **P2** | Complements #8; may absorb it once shipped |
| 46 | **Security-questionnaire automation** — respond to inbound customer SIG / CAIQ / custom questionnaires by reusing existing evidence + policies | Medium-High — massive enterprise-sales value; unlocking enterprise deals is the whole point of getting SOC 2; Vanta ships this as a standalone product | M | **P2** | Depends on #6 (policies), #16 (system description) as answer sources |
| 47 | **Employee security-awareness training tracking** — training completion per employee per topic + annual refresh cadence | Medium — direct evidence for CC1.4 / CC2; small feature, real audit value | S | **P2** | Complements HRIS in #28 |
| 48 | **Continuous-monitoring alerts** — real-time notification when a control transitions from COVERED to NEEDS_REVIEW/MISSING (e.g., MFA disabled on an account → CC6.6 alert) | Medium — makes "stay compliant every day" real in-product, not just a snapshot chart | S | **P2** | Depends on #20 (Type II clock built on `control_status_snapshots`); wire alert on transition |
| 49 | **Framework reuse mechanism** — engine that says "this evidence covers CC6.1 in SOC 2 AND A.9.2 in ISO 27001" (not the framework content itself, which is #40 — the *reuse* machinery) | Low pre-#40, high once #40 lands | M | **P3** | Complements #40; ship together |

## Critical path to first customer

```text
#1 (real CC1-CC9)  →  #2 (Policy Module MVP)  →  #6 (full policy set + CC mapping)
                                                        ↓
                            #14-17 (kickoff wizard: scope, type/period, system desc, owners)
                                                        ↓
                                         #7 (IdP)  or  #25 (AWS, if AWS-first customer)
                                                        ↓
                                             #9 (Readiness Report)
                                                        ↓
                                                  → first pilot
```

Everything else in P0/P1 is parallel enablement (#3, #4, #5, #8, #10, #11, #12, #13).
