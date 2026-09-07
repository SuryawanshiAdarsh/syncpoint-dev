# SOC 2 Controls — Syncpoint Demo Framework

## 1. Important disclaimer

The framework content shipped in this repository is a **DEMO/DEVELOPMENT
paraphrase** written specifically for Syncpoint's own testing and demos.

It is **not** the authoritative AICPA SOC 2 Trust Services Criteria and
**must not** be treated as such. Production deployments need to obtain
authoritative or appropriately licensed compliance content and load it
via a customer-specific migration or an admin ingest tool.

Syncpoint's product also **never** determines whether an organization is
SOC 2 compliant. It reports evidence-coverage states only. Compliance
determinations are made by licensed CPA firms, not by software.

## 2. Seeded framework

One framework row exists after startup:

| code   | name                                          | version |
|--------|-----------------------------------------------|---------|
| `SOC2` | SOC 2 Trust Services Criteria                | 2022    |

Loaded by [`R__seed_soc2_demo.sql`](../../backend/compliance-api/src/main/resources/db/migration/R__seed_soc2_demo.sql).
The `R__` prefix means Flyway re-applies the file whenever its checksum
changes, so seed edits do not require a new version number.

## 3. Seeded control catalogue

**38 controls**, correctly numbered and categorized against the real AICPA
2017/2022 Trust Services Criteria structure: the complete 33-criterion Common
Criteria (Security — mandatory for every SOC 2 report, CC1 through CC9) plus
the two optional categories most commonly bundled alongside Security,
Availability (A1) and Confidentiality (C1).

**Deliberately out of scope for this catalogue**: Processing Integrity (PI1,
5 criteria) and Privacy (P1-P8, 18 criteria) — see
[dev-guide/SOC2-READINESS-BACKLOG.md](../../dev-guide/SOC2-READINESS-BACKLOG.md)
item #1. A prior seed briefly included a single Privacy fragment (`P1.1`) and
a fabricated `CC8.2` control that does not exist in the real framework — both
were removed as part of this catalogue correction; the real Change Management
category (CC8) has only one criterion, `CC8.1`.

| code | category | title |
|---|---|---|
| CC1.1 | Control Environment | Integrity and Ethical Values |
| CC1.2 | Control Environment | Board Independence and Oversight |
| CC1.3 | Control Environment | Organizational Structure and Reporting Lines |
| CC1.4 | Control Environment | Commitment to Competence |
| CC1.5 | Control Environment | Accountability for Internal Control |
| CC2.1 | Communication and Information | Quality of Internal Information |
| CC2.2 | Communication and Information | Internal Communication |
| CC2.3 | Communication and Information | External Communication |
| CC3.1 | Risk Assessment | Objectives Clarity |
| CC3.2 | Risk Assessment | Risk Identification and Analysis |
| CC3.3 | Risk Assessment | Fraud Risk Consideration |
| CC3.4 | Risk Assessment | Change Impact Assessment |
| CC4.1 | Monitoring Activities | Ongoing and Separate Evaluations |
| CC4.2 | Monitoring Activities | Communication of Deficiencies |
| CC5.1 | Control Activities | Selection of Control Activities |
| CC5.2 | Control Activities | Technology General Controls |
| CC5.3 | Control Activities | Policies and Procedures |
| CC6.1 | Logical and Physical Access Controls | Logical Access Security |
| CC6.2 | Logical and Physical Access Controls | New Access Registration |
| CC6.3 | Logical and Physical Access Controls | Access Role Modification and Review |
| CC6.4 | Logical and Physical Access Controls | Physical Access Restriction |
| CC6.5 | Logical and Physical Access Controls | Decommissioning of Assets |
| CC6.6 | Logical and Physical Access Controls | External Threat Protection |
| CC6.7 | Logical and Physical Access Controls | Restricted Data Transmission |
| CC6.8 | Logical and Physical Access Controls | Malicious Software Prevention |
| CC7.1 | System Operations | Detection and Monitoring |
| CC7.2 | System Operations | System Anomaly Monitoring |
| CC7.3 | System Operations | Security Event Evaluation |
| CC7.4 | System Operations | Incident Response Execution |
| CC7.5 | System Operations | Incident Recovery |
| CC8.1 | Change Management | Change Management |
| CC9.1 | Risk Mitigation | Business Disruption Risk Mitigation |
| CC9.2 | Risk Mitigation | Vendor and Business Partner Risk Management |
| A1.1 | Availability | Capacity Monitoring |
| A1.2 | Availability | Environmental Protections and Recovery Infrastructure |
| A1.3 | Availability | Recovery Plan Testing |
| C1.1 | Confidentiality | Confidential Information Identification |
| C1.2 | Confidentiality | Confidential Information Disposal |

Each row has a short paraphrased description — see the migration file for
the exact wording. Descriptions are intentionally generic and non-actionable
so this file does not pretend to be authoritative guidance.

## 4. Control status states

Statuses displayed to users (spec §27) are **product evidence-readiness
states**, not compliance determinations:

- **COVERED** — at least one `HUMAN_CONFIRMED` mapping with
  classification `COVERED` and no rejections.
- **PARTIAL** — human confirmation with `PARTIAL`, or a mix that includes
  rejected mappings.
- **NEEDS_REVIEW** — AI has suggested a mapping, but no human has confirmed
  or rejected it.
- **MISSING** — no mappings at all for the control in the current org.

Statuses are computed on read by
[`MappingBasedControlStatusResolver`](../../backend/compliance-api/src/main/java/com/syncpoint/compliance/compliance/service/MappingBasedControlStatusResolver.java)
so a fresh mapping or review is reflected immediately.

## 5. Categories referenced

Categories referenced in `soc2-controls.md` and used by the frontend filter:

```
Access Control
Authentication
Change Management
Data Protection
Availability
Security Monitoring
Incident Management
Risk Management
Vendor Management
```

Adding a category means adding controls with that category name; the
category list is derived from the `controls` table at read time (no
separate `control_categories` table in this MVP).

## 6. What "AI classifications" mean

Backend and AI service use a distinct classification vocabulary
(`COVERED`, `PARTIAL`, `INSUFFICIENT`) for **AI's per-evidence-per-control
verdict**, not for the customer's compliance status. AI never returns:

- `COMPLIANT`
- `CERTIFIED`
- `NON_COMPLIANT`

These strings are actively blocked at the AI service boundary by a
Pydantic `field_validator` (`ai-service/app/schemas.py`).

## 7. Extending to new frameworks

The `frameworks` and `controls` tables are keyed by `code` and
`(framework_id, code)` respectively, so adding e.g. ISO 27001 is:

1. INSERT a new frameworks row (e.g. `code='ISO27001'`).
2. INSERT rows into `controls` referencing that framework's id.
3. Optionally add a new repeatable migration `R__seed_iso27001.sql`.

No code changes are needed unless the framework demands new evidence types
that don't fit the existing `evidence_versions` model (unlikely).

## 8. Customer-supplied frameworks (post-MVP)

For production Syncpoint would provide an authenticated admin UI that
uploads a licensed framework bundle into new `frameworks` + `controls`
rows scoped to the customer or plan. That UI is out of scope for the MVP.
