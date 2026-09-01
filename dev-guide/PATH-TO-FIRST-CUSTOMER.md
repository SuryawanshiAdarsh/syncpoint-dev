# Path to First Paying Customer

> Companion to [MVP-COMPLETION-PLAN.md](MVP-COMPLETION-PLAN.md).
> That doc tracks technical milestones (M1 → M10). This one tracks the *entire* gap between "MVP works locally" and "first paying customer signed and onboarded" — code, ops, business, legal, and trust.

## 1. Why this document exists

The MVP code is roughly 70 % ready for a real customer. But **the code is the smallest fraction of what's needed to close and onboard a paying customer** for a compliance product. This document is the honest, ordered checklist of everything else.

If you're wondering *"what's actually blocking revenue?"* — start here.

## 2. The customer's own checklist

A prospective paying customer for a compliance product is a security-conscious buyer. They will ask, in roughly this order:

| # | Their question | Current answer | Gap |
|---|---|---|---|
| 1 | Where do we sign up? | Local URL only | **No hosted URL. No custom domain. No TLS.** |
| 2 | Are you SOC 2 compliant yourselves? | No | **Recursive credibility problem.** SOC 2 Type I minimum. |
| 3 | Where does my evidence live? | MinIO in a single container | Fine for pilot; production wants "S3 with server-side encryption" story |
| 4 | Who at Syncpoint can see my data? | Anyone with DB access | Need documented access-control policy + logged human access |
| 5 | Can I export my data if I churn? | Manual DB dump only | Self-serve "export everything" button |
| 6 | What's the SLA? | Undefined | Written SLA (99.5 % is enough for design partners) |
| 7 | Where's the status page? | None | status.syncpoint.io — even manual updates count |
| 8 | Where's the trust center? | None | Public page: architecture, encryption, audit posture, subprocessors |
| 9 | Where's the DPA? | None | Data Processing Agreement — table stakes for EU customers |
| 10 | Is your OAuth to my GitHub actually secure? | We use PATs (M6 not done) | **Real OAuth is required.** No customer pastes an admin PAT. |
| 11 | Do you scan uploaded files for malware? | No (M10 not done) | Legal will require a "yes" |
| 12 | If your database is compromised, is my secret encrypted? | Yes (envelope encryption already exists) | ✅ Actually good |
| 13 | Can you SSO with Okta? | No | Enterprise blocker (not first-customer blocker) |
| 14 | Who do I call at 2 am? | Nobody | At minimum: on-call email + Slack Connect channel |

**Verdict**: about **35–40 % of these are showstoppers**. The rest are "yes we'll get there" negotiations you can win in a design-partner conversation.

## 3. Technical gaps

Only counting things that block a real customer, not things on the roadmap generally.

### 3.1 Absolute blockers

| # | Milestone | Why it's a blocker | Estimate |
|---|---|---|---|
| 1 | **M6 GitHub OAuth** | No customer pastes a PAT with admin scopes. | 1 week |
| 2 | **M7 AWS integration** | ~60 % of SOC 2 evidence lives in AWS for a SaaS customer. | 1 week |
| 3 | **M2 real LLM (OpenAI)** | The stub returns identical output for everything; a 30-second demo catches it. | 3 days |
| 4 | **M5 RAG connected to analysis** | Without it, AI citations are cosmetic. Auditors spot it immediately. | 1 week |
| 5 | **M1 onboarding gate** | Every login lands on Dashboard even for a fresh org that has done nothing. | 1 day |
| 6 | **Persistent secret-store master key** | Currently generated on boot if env var missing — production needs vault-provided key + rotation docs. | 2 days |

### 3.2 Important, not blockers

- **M3 real embeddings** — quality of RAG suffers without them
- **M4 RAG ingestion** — customer-specific compliance policies should feed the corpus
- **M10 malware scanning** — legal review will ask
- **Rate limiting beyond `/auth/*`** — `/evidence/upload` and `/rag/query` should also be limited
- **Password reset flow** — completely missing
- **Email verification on signup** — completely missing

### 3.3 Nice-to-have, defer

- M8 scheduled collection (daily-manual button clicks are fine for first customer)
- M9 Jira collector
- Google Workspace
- Multi-framework (ISO 27001, HIPAA)

**Reasonable "code MVP for first customer"**: M1 + M2 + M5 + M6 + M7 + password reset + persistent key.
About **4–6 weeks of focused work**.

## 4. Non-code gaps

Equally important — arguably more, since these have longer lead times.

### 4.1 Business

| Item | Status | Effort | Notes |
|---|---|---|---|
| Pricing model decided | ❌ | 1 week | Per-user, per-integration, per-control, or flat. Probably per-user for first customer. |
| Legal entity / bank account | Unknown | 2–4 weeks | Blocks receiving money |
| MSA / Order Form templates | ❌ | 1 week (lawyer) | Necessary for contract |
| Insurance (E&O + Cyber) | ❌ | 1 week (broker) | Customer legal will ask |
| Basic billing (Stripe or invoice) | ❌ | 1 week | Stripe Checkout is fast; manual invoicing is faster if only 1–3 customers |

### 4.2 Legal / compliance

| Item | Status | Effort |
|---|---|---|
| Terms of Service | ❌ | 1 week |
| Privacy Policy | ❌ | 1 week |
| DPA template | ❌ | 1 week |
| Subprocessor list | ❌ | Half day (list AWS/OpenAI/Postgres provider/etc.) |
| Cookie / GDPR notice | ❌ | Half day |
| **Syncpoint's own SOC 2 Type I** | ❌ | **3–6 months** with Vanta/Drata + auditor |

### 4.3 Ops

| Item | Status | Effort |
|---|---|---|
| Hosted deployment (Hetzner / DO / Fly / AWS) | ❌ | 1 week (Docker Compose on a VM + Caddy for TLS) |
| Custom domain + DNS | ❌ | 1 day |
| Automated backups | ❌ | 1 week (pg_dump + rsync to S3 nightly) |
| Uptime monitor (UptimeRobot / Better Uptime) | ❌ | 1 hour |
| Error tracking (Sentry) | ❌ | 2 days |
| Public status page (Statuspage / Instatus) | ❌ | 1 hour |
| On-call rotation | ❌ | Half day (even solo — an email that pages your phone) |
| Support inbox (support@syncpoint.io) | ❌ | 1 hour |
| Runbook for common issues | ❌ | 2 days |

### 4.4 Sales / onboarding materials

| Item | Status | Effort |
|---|---|---|
| Product one-pager | ❌ | Half day |
| Demo script | ❌ | 2 days |
| Case study / ROI calc | ❌ | 2 days (fill in after first customer) |
| Onboarding video (Loom, 5 min) | ❌ | 2 hours |
| docs.syncpoint.io | ❌ | 1 week (mkdocs or Docusaurus) |
| Email templates (welcome, review-needed, weekly digest) | ❌ | 3 days |

## 5. The recursion problem

A compliance product asking a customer to trust it with their compliance data has a special credibility bar. Three ways to handle it:

### Option A — Wait for your own SOC 2 Type I first
- **Timeline**: 3–6 months
- **Pros**: Safest, cleanest sales conversation
- **Cons**: Zero revenue during that time

### Option B — Announce "SOC 2 in progress" + Trust Center + design-partner pricing
- **Timeline**: 2–4 weeks
- **Pros**: Standard startup approach, works if transparent
- **Cons**: Some deals will wait

### Option C — Sell only to pre-audit shops first
- **Timeline**: Same as MVP-completion
- **Pros**: Fastest revenue path
- **Cons**: Limits deal size; those customers are the smallest

**Recommended: Option B is the pragmatic default.** Start Syncpoint's own SOC 2 program on Day 1 (Vanta/Drata) so it runs in the background regardless of which sales path is taken.

## 6. Recommended path — 8-to-12-week plan

If the goal is **first paying customer in 8–12 weeks**, this is the ordered checklist. Parallel tracks are marked.

### Weeks 1–4 — Product hardening

Sequential:
1. Finish M1 (onboarding gate) — 1 day
2. Finish M6 (GitHub OAuth) — 1 week
3. Finish M2 (real OpenAI LLM) — 3 days
4. Finish M5 (RAG → analysis) — 1 week
5. Finish M7 (AWS integration) — 1 week
6. Password reset + email verification — 3 days
7. Persistent master-key handling — 2 days

### Weeks 3–5 — Ops + deploy (parallel with weeks 3–5 of product)

1. Provision VPS, point domain, TLS via Caddy — 1 day
2. Backups: nightly pg_dump + minio sync to S3 — 2 days
3. Sentry + UptimeRobot + Statuspage — 1 day
4. Support inbox + Slack Connect channel template — half day
5. `docs.syncpoint.io` — 3 days

### Weeks 5–8 — Business + legal (parallel)

1. Incorporate, open bank, get insurance
2. TOS + Privacy + DPA + subprocessor list drafted
3. Pricing decided (per-user or per-active-integration; $500–$2,000/mo range for design partners)
4. MSA / Order Form templates
5. Trust Center page (single HTML page is fine to start)

### Weeks 8–12 — Sales + first-customer onboarding

1. First-customer contract signed
2. Guided onboarding call (do it manually — you learn a lot)
3. First AWS + GitHub integration lit up
4. First real audit-package export sent to their auditor
5. Fix everything that broke in that flow

### Concurrent (starts Week 1) — Syncpoint's own SOC 2

Sign up with Vanta or Drata Day 1 of Week 1. Type I report typically 3–4 months out. Runs in the background regardless.

## 7. The 80/20 minimums

The absolute smallest list to close a first customer at a reduced "design partner" price:

- ✅ Working GitHub OAuth (M6)
- ✅ Working AWS assume-role (M7)
- ✅ Real OpenAI LLM (M2 core)
- ✅ Onboarding gate (M1)
- ✅ Hosted at a public URL over HTTPS
- ✅ Terms of Service + Privacy Policy
- ✅ Nightly backups
- ✅ Support email
- ✅ "SOC 2 in progress" statement on the website

Six of these are code. Three are non-code. Total scope: **~6 weeks of focused work** for a small team.

## 8. Honest assessment as of this pass

| Area | State | Confidence to demo | Confidence to sell |
|---|---|---|---|
| Code | ~70 % of MVP done | High | Medium |
| Ops | ~5 % of what production needs | Low | Low |
| Business/legal | ~0 % — nothing exists yet | N/A | Zero without this |
| Trust (public posture) | 0 % — no trust center, no SOC 2 posture | N/A | Blocks security-conscious buyers |

**The technical MVP is 70 % there. The commercial MVP is 15 % there.** That's the point to emphasize most when planning honestly.

## 9. Pricing model — first-cut discussion

Not committed yet. Common patterns for a product like this:

| Model | How it works | Notes |
|---|---|---|
| **Per user** | Flat fee per member of the tenant. | Simplest; aligns with seats but under-monetizes automation. |
| **Per active integration** | Flat fee per connected GitHub / AWS / Jira. | Aligns with value delivered; predictable. |
| **Per control monitored** | Fee per active framework control. | Feels weird to customers; not recommended. |
| **Flat monthly per tenant** | One price for all features. | Easiest sales conversation; hardest to expand revenue. |
| **Hybrid** | Base tier + per-integration add-ons. | What most compliance vendors settle on. |

**Recommended first-customer approach**: single flat monthly price ($1,000–$2,000/mo) with unlimited users and up to N integrations. Simple to negotiate, expandable later. Do not obsess about pricing before you have three paying customers to learn from.

## 10. Trust Center — what it must contain

Even a single HTML page is enough for first-customer signing. Sections:

1. **What we protect** — evidence artifacts, credentials, PII
2. **How we protect it** — envelope encryption at rest, TLS in transit, tenant isolation
3. **Where it lives** — data center region, subprocessor list
4. **Our compliance posture** — "SOC 2 Type I in progress with [auditor], expected [date]"
5. **How to report a security issue** — security@syncpoint.io + a link to a disclosure policy
6. **Contact for DPA/MSA questions** — legal@syncpoint.io
7. **Subprocessor list** — AWS, OpenAI, Docker Hub, Sentry, [analytics tool], [error tracker]

## 11. What to draft next

If any of the following would be useful, they're small enough to draft quickly:

- **Pricing model** — one-page decision doc with the 3 candidate models
- **Trust center page skeleton** — HTML file with the 7 sections above
- **DPA / TOS shortlist** — checklist of what a lawyer needs to know
- **SOC 2 Type I gap analysis** for Syncpoint itself — 15 controls × current state × what's needed
- **First-customer onboarding runbook** — the exact steps a founder walks through with the first customer
- **Sales one-pager** — the marketing page that goes at syncpoint.io/product

Each of these is roughly 1 day of drafting. Ask when you want any of them.

---

*This document is intentionally not aspirational. Every gap listed is a real gap that a security-conscious buyer will notice. The order matters: fix product blockers first (weeks 1–4), then ops (weeks 3–5), then business/legal (weeks 5–8), then sell (weeks 8–12). All while Syncpoint's own SOC 2 grinds forward in the background.*
