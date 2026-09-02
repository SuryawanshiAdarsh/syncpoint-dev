# Legal Readiness Guide

> Everything you need to sign a paying pilot customer, in plain English.
> Not legal advice — get a lawyer for the actual review — but a concrete map of what's needed, what it costs, and how long it takes.

## 1. What documents you need before taking money

The five essentials. You **cannot** send an invoice without at least the first three signed.

| Doc | What it is | Who signs | When needed |
|---|---|---|---|
| **Terms of Service (TOS)** | The click-through agreement every user accepts on signup | Nobody signs directly — accepted by clicking a checkbox at signup | Before any user can register on prod |
| **Privacy Policy** | What data you collect, how you use it, who you share it with | Same — click-through | Before any user registers |
| **Master Services Agreement (MSA)** | The umbrella contract between Syncpoint (you) and the customer's legal entity | Both parties sign | Before contract sale |
| **Order Form** | One-page addendum to the MSA specifying price, term, seats, start date | Both parties sign | With MSA, per deal |
| **Data Processing Agreement (DPA)** | Required by GDPR/UK GDPR/DPDP for customers in those regions; specifies you're a "processor" of their data | Both parties sign | For any EU/UK/India customer |

## 2. Optional but expected

Not blockers for a single first pilot, but expected by anyone above tiny-company size:

| Doc | When you'll be asked |
|---|---|
| **Subprocessor list** (public HTML page) | First security-conscious customer |
| **Security Whitepaper** (5-page PDF) | First enterprise-adjacent customer |
| **BAA (Business Associate Agreement)** | Only if you sell to HIPAA-covered entities (skip unless healthcare) |
| **Standard Contractual Clauses (SCC)** attachment to DPA | If EU customer + you host in the US |
| **Cyber Insurance certificate** | Larger deals, procurement will ask |

## 3. Where to get templates (do NOT write from scratch)

Ranked by cost.

### Free / open-source templates (fine for design partners)

- **Common Paper** — [commonpaper.com](https://commonpaper.com) — free MSA, Order Form, DPA templates written by ex-YC legal counsel. **Start here.**
- **Y Combinator's Standard Docs** — [ycombinator.com/documents](https://www.ycombinator.com/documents) — for incorporation-related docs (SAFE, Series A, etc.)
- **GitHub Terms of Service** ([github.com/site/terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)) — read as a reference, don't copy verbatim

### Cheap paid ($200–$800 total)

- **Ironclad "Ready" templates** — SaaS-specific TOS + Privacy + DPA + MSA — ~$300 for the bundle
- **ContractsCounsel.com** — hire a startup lawyer for a fixed fee to review Common Paper templates. Typically $300–$500 for a one-time review pass
- **Termly / iubenda** — auto-generated Privacy + Terms + Cookie policies — ~$100/year. Good enough for first year, replace when you have a real legal budget

### Real legal firm ($3k–$10k)

- Only worth it once you're doing $100k+ ARR
- Firms to consider: Cooley, Gunderson, Cleary Gottlieb — expensive but reusable across all customers
- For first pilot: **skip this**, use Common Paper + a $500 ContractsCounsel review

## 4. Ordered checklist

Do these in order. Numbers are the roughly guaranteed cost + calendar time.

| # | Task | Cost | Time |
|---|---|---|---|
| 1 | Download Common Paper MSA + Order Form + DPA templates | Free | 1 hour |
| 2 | Adapt names, addresses, jurisdiction, notice period. Save as `templates/msa.docx`, etc. | Free | 2 hours |
| 3 | Write Privacy Policy — use Termly ($10/mo) or write from a SaaS template. Cover: what you collect (email, name, evidence contents), where it lives (AWS S3 in region X), who has access (you), retention (90 days after churn), deletion request process | $10 | 1 day |
| 4 | Write TOS — use Termly or copy Common Paper's template. Add: your name, jurisdiction, arbitration clause (opt out), acceptable use, termination | $0 | half day |
| 5 | Deploy Privacy + TOS to `syncpoint.io/privacy` and `/terms` as static HTML pages | $0 | 1 hour |
| 6 | Update the register form to include a "I agree to Terms and Privacy Policy" checkbox that links to those pages | $0 | 30 min |
| 7 | Hire ContractsCounsel for a one-time review of MSA + Order Form + DPA + TOS + Privacy — get a lawyer to spot issues | $300–$500 | 1 week |
| 8 | Apply the lawyer's redlines. Version everything as `v1.0` | $0 | 2 hours |
| 9 | Write a Subprocessor list — 1 HTML page listing AWS, OpenAI, Docker Hub, Sentry, whoever you use | $0 | 1 hour |
| 10 | Save signed copies in an encrypted folder (Dropbox or Google Drive with 2FA) — you need to produce them years later | $0 | 30 min |

**Total**: $310–$510, ~1.5 weeks of calendar time (most of which is waiting for lawyer).

## 5. Jurisdiction cheat sheet

Different legal home = different rules. Rough guide:

| Jurisdiction | Notes |
|---|---|
| **Delaware C-Corp (US)** | The standard for SaaS. Take VC money later. State franchise tax ~$400/yr. |
| **Delaware LLC (US)** | Simpler for solo founders; less friendly to VC. |
| **UK Ltd** | Fine for European SaaS. Watch VAT. |
| **India Private Limited** | If you're based there, easiest. Watch RBI rules on receiving foreign payments (FIRC). |
| **Singapore Pte Ltd** | Good for international operations. Higher setup cost (~$1500) but low tax. |

**Recommendation for first paying pilot**: whatever's easiest to incorporate wherever you already are. You can restructure later. Do NOT delay the pilot to change jurisdictions.

## 6. Compliance-product-specific gotchas

Because you're selling a compliance product, extra sensitivity applies:

1. **Never claim your customer is "SOC 2 compliant."** Your TOS and marketing should say Syncpoint helps *prepare for and evidence* a SOC 2 audit — the audit conclusion is the CPA firm's. This mirrors PROJECT_SPEC3 §6.5.
2. **Add a "no warranty" clause** — you can't guarantee the customer passes their audit. Their auditor makes that call.
3. **Data-in-evidence sensitivity** — customer evidence may contain PII (IAM user emails, incident tickets). Your DPA needs to say you handle this as a processor and delete on request.
4. **Retention clause** — how long do you keep evidence after churn? Recommend: 30 days grace period for export, then delete within 60 days. Document this in TOS + Privacy.
5. **Audit-log preservation** — even after deletion, keep the audit-log metadata (who did what, when) for 12 months for your own defensibility. Say so in Privacy Policy.

## 7. What you send a customer to sign

Once your templates are ready, the deal packet is:

```
├── 01_Syncpoint_MSA_v1.0.pdf              (your standard MSA)
├── 02_Order_Form_CustomerName_2027-01.pdf (per-deal price + term)
├── 03_Syncpoint_DPA_v1.0.pdf              (if EU/UK/India)
└── 04_Subprocessor_List_v1.0.pdf          (informational)
```

Send via DocuSign, HelloSign, or PandaDoc (all have free tiers). Total sign flow: ~5 minutes for the customer.

## 8. Anti-patterns

Things NOT to do:

- ❌ Write your own MSA from scratch. It will have holes a lawyer would spot in 30 seconds.
- ❌ Copy a competitor's MSA verbatim. IP infringement + they used a lawyer, you didn't.
- ❌ Skip the DPA "because they didn't ask." Any decent procurement team will ask on renewal.
- ❌ Sign an NDA the customer sends without reading — they often contain assignment clauses that give them your IP.
- ❌ Promise "SOC 2 by [date]" — under-promise (3–6 months longer than you think) and over-deliver.
- ❌ Handle customer-supplied contracts alone. If they redline your MSA or send their own, get lawyer eyes. First deal is not worth taking on hidden liability.

## 9. Where to store signed docs

- Encrypted Dropbox or Google Drive folder, one subfolder per customer, 2FA on the account
- File naming: `2027-01-15__CustomerName__MSA_signed.pdf`
- Do NOT commit signed docs to a git repo (even a private one)
- Keep an unsigned template of each doc in the repo under `legal/templates/` for reference

## 10. When you'll need to revisit

Update these documents when any of the following happens:

- You add a new subprocessor (new AI provider, new hosting, new analytics tool) → Subprocessor list
- You enter a new region (US → EU) → Privacy Policy geographic clauses
- You raise a Series A → whole legal package review by real firm
- Your first customer redlines heavily → template incorporates common redlines
- Your first data breach or security incident → mandatory review of DPA notification clauses

## Summary — the smallest legal setup that lets you take money

For your first paying pilot, this is enough:

1. Common Paper MSA + Order Form (adapted) — free
2. Termly-generated Privacy + Terms — $10/mo
3. Common Paper DPA (only if EU customer) — free
4. Subprocessor list HTML page — free
5. $300–$500 one-time review by ContractsCounsel
6. DocuSign free tier for signing

**Total**: $310–$510, ~2 weeks calendar.

Everything above this is optimization. Do it once you have three paying customers, not before.
