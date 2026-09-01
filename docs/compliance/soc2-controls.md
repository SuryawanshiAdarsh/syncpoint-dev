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
| `SOC2` | SOC 2 Trust Services Criteria (DEMO)          | 2022    |

Loaded by [`R__seed_soc2_demo.sql`](../../backend/compliance-api/src/main/resources/db/migration/R__seed_soc2_demo.sql).
The `R__` prefix means Flyway re-applies the file whenever its checksum
changes, so seed edits do not require a new version number.

## 3. Seeded control catalogue

Fifteen controls covering the ten categories listed in PROJECT_SPEC2 §26.

| code    | category            | title                                    |
|---------|---------------------|------------------------------------------|
| CC6.1   | Access Control      | Logical Access Controls                  |
| CC6.2   | Access Control      | Access Provisioning and De-provisioning  |
| CC6.3   | Access Control      | Periodic Access Review                   |
| CC6.6   | Authentication      | Multi-Factor Authentication              |
| CC6.7   | Data Protection     | Encryption in Transit and at Rest        |
| CC7.1   | Security Monitoring | System Monitoring                        |
| CC7.2   | Incident Management | Incident Response                        |
| CC8.1   | Change Management   | Change Management                        |
| CC8.2   | Change Management   | Segregation of Environments              |
| CC9.1   | Risk Management     | Risk Management                          |
| CC9.2   | Vendor Management   | Vendor Risk Management                   |
| A1.1    | Availability        | Availability Monitoring                  |
| A1.2    | Availability        | Backup and Recovery                      |
| C1.1    | Data Protection     | Confidentiality Classification           |
| P1.1    | Data Protection     | Privacy Notice                           |

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
