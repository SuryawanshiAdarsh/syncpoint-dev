# Bug Backlog

Known issues that are deliberately **not fixed yet**. Logged here instead of fixed on the spot so
they don't get lost, and so a fix can be scoped properly instead of patched ad-hoc.

Severity: **P1** blocks a core flow · **P2** visible/annoying but has a workaround · **P3** cosmetic/edge case.

| ID | Status |
|---|---|
| [BUG-001](#bug-001-review-queue-action-column-overflows-the-table) | Open |
| [BUG-002](#bug-002-review-queue-open-in-evidence-does-not-deep-link-to-the-row) | Open |

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
