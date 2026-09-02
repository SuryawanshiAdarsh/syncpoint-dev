# Bug Backlog

Known issues that are deliberately **not fixed yet**. Logged here instead of fixed on the spot so
they don't get lost, and so a fix can be scoped properly instead of patched ad-hoc.

Severity: **P1** blocks a core flow · **P2** visible/annoying but has a workaround · **P3** cosmetic/edge case.

| ID | Status |
|---|---|
| [BUG-001](#bug-001-review-queue-action-column-overflows-the-table) | Open |
| [BUG-002](#bug-002-review-queue-open-in-evidence-does-not-deep-link-to-the-row) | Open |
| [BUG-003](#bug-003-soc-2-badge-is-hardcoded-instead-of-read-from-the-orgs-active-framework) | Open |
| [BUG-004](#bug-004-demo-label-is-hardcoded-instead-of-driven-by-environment-config) | Open |
| [BUG-005](#bug-005-no-versioned-acceptance-tracking-for-legal-documents) | Open |

---

## BUG-001: Review Queue action column overflows the table

- **Severity**: P2
- **Area**: Frontend — [review-queue.component.ts](../frontend/compliance-ui/src/app/features/review-queue/review-queue.component.ts)
- **Found**: 2026-09-02, while adding table view + pagination to the Review Queue.

### Symptom
The `Open in Evidence` button in the Actions column renders past the right edge of the table/card
(clipped text, e.g. "Ope… Evide…"), instead of staying inside its cell.

### Root cause
- `.btn` is `display: inline-flex`. Flex items default to `min-width: auto`, which locks their
  minimum size to the un-wrapped text width — the button physically cannot shrink or wrap below
  "Open in Evidence" on one line.
- `.data-table` (`styles.scss`) uses the browser's auto table layout (`width: 100%`, no
  `table-layout: fixed`, no column-width budget). With 6 content-heavy columns (name, source pill,
  status badge, freshness badge, reason chip, action button) squeezed into a fixed-width card, the
  browser shrinks columns below their content's minimum instead of growing the table, and
  unshrinkable content (the button) paints past its box.
- This is the **second** occurrence of the same failure mode on this page (the reason-chip pill hit
  the identical bug and was patched by allowing it to wrap — see git history on this file). Patching
  cell-by-cell is treating the symptom, not the layout strategy.

### Proposed fix (agreed, not yet implemented)
1. Wrap `<table class="data-table">` in a `.table-scroll { overflow-x: auto; }` container as a
   baseline safety net, so content that can't fit scrolls inside the card instead of bleeding
   outside the viewport.
2. Replace the text action with an icon-only button (`open_in_new` + `aria-label`/`title`) —
   removes the one unshrinkable wide node in the row.
3. Add `table-layout: fixed` (scoped via a modifier class so Evidence/Controls tables are
   unaffected) with an explicit `<colgroup>` width budget: Name 32% / Source 14% / Status 12% /
   Freshness 12% / Reason 18% / Actions 12%.

### Why deferred
Kept aside at the user's request to discuss the *navigation* behavior of the same button
(BUG-002) before touching its layout again — no point re-laying-out a button whose destination is
also being redesigned.

---

## BUG-002: Review Queue "Open in Evidence" does not deep-link to the row

- **Severity**: P1 (silently defeats the purpose of the Review Queue for ~half of its entries)
- **Area**: Frontend — [review-queue.component.ts](../frontend/compliance-ui/src/app/features/review-queue/review-queue.component.ts), [evidence.component.ts](../frontend/compliance-ui/src/app/features/evidence/evidence.component.ts)
- **Found**: 2026-09-02, during product review of the Review Queue.

### Symptom
Every row's action button is a static `routerLink="/evidence"` — clicking it always lands on the
same generic Evidence Library page with default filters, regardless of which row was clicked.

### Root cause / impact
The Evidence Library defaults its status chip to **"Needs attention"**
(`COLLECTED` + `UNDER_REVIEW` only). Two of the three Review Queue reasons can point at evidence
that is already `APPROVED`:

| Reason | Evidence status can be | Visible under default "Needs attention" filter? |
|---|---|---|
| UNMAPPED | `COLLECTED` | Yes |
| EXPIRING | `APPROVED` (already-approved evidence expiring) | **No — filtered out** |
| LOW_CONFIDENCE | `APPROVED` | **No — filtered out** |

So clicking the button for an expiring or low-confidence row sends the user to a page that doesn't
even show the item they came to act on. They have to notice it's missing, clear the filter, then
hunt for it in a flat list — the deep link is effectively a dead end for those rows.

### Proposed fix (agreed direction, not yet implemented)
**Option A (minimum correct fix, do first)**: navigate to `/evidence?highlight=<evidenceId>`. The
Evidence page, on seeing that param, resets filters to a state guaranteed to include the item
(status → `ALL`, source/freshness/mapped → cleared), jumps pagination to the item's page, scrolls
it into view, and applies a brief highlight pulse. Backend-free, fixes all three reasons uniformly.

**Option B (fast-follow, more work)**: route per-reason instead of to one shared destination —
e.g. LOW_CONFIDENCE jumps straight to the mapped control's Control Detail page (where the AI
suggestion + Confirm/Reject UI already lives). Blocked on `EvidenceResponse` not currently exposing
a resolvable control ID for mapped items (only `mappingCount`), and on EXPIRING having no
"request re-collection" flow yet (that's an M8 scheduled-collection feature, not built).

### Why deferred
User asked to log this for later rather than implement Option A/B in this pass.

---

## BUG-003: SOC 2 badge is hardcoded instead of read from the org's active framework

- **Severity**: P2 (produces an incorrect compliance claim for any non-SOC-2 tenant)
- **Area**: Frontend — [shell.component.ts](../frontend/compliance-ui/src/app/shared/shell/shell.component.ts), [login.component.ts](../frontend/compliance-ui/src/app/features/login/login.component.ts), [register.component.ts](../frontend/compliance-ui/src/app/features/register/register.component.ts)
- **Found**: 2026-09-02, during a discussion on where product name/version/legal info should live.

### Symptom
The string `SOC 2 (DEMO)` is hardcoded in three components. `frameworks` is already a real,
per-organization table (`code`, `name`, `version`, `active`) — an org running ISO 27001 instead of
SOC 2 would still see a "SOC 2" badge, which is a false compliance claim, not just a cosmetic bug.

### Proposed fix
Fetch the org's active framework(s) (e.g. via `GET /api/v1/organizations/current` or a small
`/frameworks?active=true` call already backing the Controls page) and render the real code(s)
instead of a literal string.

### Why deferred
Logged per user request; not scheduled for this pass.

---

## BUG-004: "(DEMO)" label is hardcoded instead of driven by environment config

- **Severity**: P3
- **Area**: Frontend — same three components as BUG-003
- **Found**: 2026-09-02, same discussion as BUG-003.

### Symptom
`(DEMO)` is baked into the template string rather than reflecting whether the running instance is
actually a demo/trial deployment vs. a paid production tenant.

### Proposed fix
Surface an environment/deployment flag from the backend (e.g. on the `/me` or a small `/config`
response) and drive the label from that, so a production deployment doesn't accidentally ship the
literal text "(DEMO)".

### Why deferred
Logged per user request; not scheduled for this pass.

---

## BUG-005: No versioned acceptance tracking for legal documents

- **Severity**: P1 for go-to-market, not a defect in the current MVP
- **Area**: Backend (new), ties into [LEGAL.md](LEGAL.md)
- **Found**: 2026-09-02, same discussion as BUG-003/BUG-004.

### Symptom
There is no record of which version of the Terms of Service / DPA / Privacy Policy a customer
organization has accepted, or when. This is a real requirement before signing paying customers
(and ironically the exact kind of evidence Syncpoint itself helps other companies track for SOC 2).

### Proposed fix
A `legal_acceptances` table (org/user FK, document type, document version, accepted-at timestamp)
plus versioned storage of the legal document content (DB rows or versioned static assets referenced
by a DB pointer), so "customer X accepted version 3 of the DPA on date Y" is provable.

### Why deferred
This is a feature, not a bug — logged here per user request, but should graduate to
[ROADMAP.md](ROADMAP.md) / [PATH-TO-FIRST-CUSTOMER.md](PATH-TO-FIRST-CUSTOMER.md) once scheduled,
since it gates real customer contracts rather than being a defect in existing behavior.
