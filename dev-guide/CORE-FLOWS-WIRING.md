# Core Flows Wiring Plan (4-Day Sprint)

> Companion to [ROADMAP.md](ROADMAP.md).
> Fills the "workflows feel static" gap in the current UI. Makes the four core end-to-end flows — onboarding, dashboard, evidence mapping, control detail — actually work.
> This is a **UX-wiring sprint**, not a feature build. No new services, no new tables (except one column). Everything is DTO extensions + toast plumbing + a handful of button click handlers.

## 1. Why this sprint exists

The current UI *reads* like the spec but doesn't *act* like it. Clicking buttons often fires the API call correctly but produces no visible feedback — no toast, no row refresh, no state transition on screen. New users can't tell whether their action worked.

This plan closes that gap in four working days. After it lands, a first-time user can complete the whole product loop (sign up → onboard → upload → map → confirm → see COVERED) without asking *"did that work?"*.

## 2. The four flows

### 2.1 Flow 1 — Onboarding

```
Register  →  /onboarding  →  do the 5 steps  →  arrive at /dashboard
                              ↑ actual actions        ↑ marked complete forever
```

### 2.2 Flow 2 — Dashboard

```
Land on /dashboard  →  see coverage, gaps, recent evidence  →  click a gap
     ↑ numbers reflect          ↑ these are drill-downs           ↓
       what actually happened                                    /controls/:id
```

### 2.3 Flow 3 — Evidence mapping

```
Upload evidence  →  see it in the list  →  map it to a control  →  see it counted
                    ↑ immediately         ↑ toast confirms        ↑ dashboard reflects
                                            ↓
                                          Optional: AI analyze
                                            ↓
                                          See AI's suggested control + confidence
```

### 2.4 Flow 4 — Control panel / detail

```
Click a control  →  see mapped evidence  →  confirm an AI suggestion  →  control goes COVERED
                    ↑ with mapping type    ↑ single button              ↑ status pill changes
                                             ↓
                                           Or: reject AI suggestion → mapping removed
```

## 3. Per-flow gap matrix

Legend: 🔴 blocking gap · 🟡 partial · ✅ works today

### Flow 1 — Onboarding

| Gap | Fix | Backend | Frontend |
|---|---|:-:|:-:|
| 🔴 No `onboarding_completed` flag | Flyway `V15__organizations_onboarding.sql` — add `BOOLEAN NOT NULL DEFAULT FALSE` + `TIMESTAMPTZ` | ✓ | |
| 🔴 No way to read/write the flag | `GET /organizations/current` returns `{onboardingCompleted, onboardingCompletedAt}`; `POST /organizations/current/onboarding/complete` sets it | ✓ | |
| 🔴 No gate — user can skip | Auth guard: if `!onboardingCompleted` and route ≠ `/onboarding`, redirect to `/onboarding` | | ✓ |
| 🔴 No "Finish setup" button on the last step | Add button on the "Watch coverage grow" card that fires the complete endpoint then routes to `/dashboard` | | ✓ |
| 🟡 Steps 1–4 feel like descriptions | Each step card gets a clear CTA button that navigates + comes back to onboarding automatically on browser back | | ✓ |

**Verify by**: register a fresh user → land on `/onboarding` → click through the 4 CTAs → click "Finish setup" on step 5 → land on `/dashboard` → log out → log back in → land directly on `/dashboard`, no more forced onboarding.

### Flow 2 — Dashboard

| Gap | Fix | Backend | Frontend |
|---|---|:-:|:-:|
| 🔴 Numbers don't refresh after actions on other pages | Subscribe to `router.events` in the shell; on navigation to `/dashboard`, re-fetch summary / gaps / recent — or add a small "Refresh" button | | ✓ |
| ✅ Clicking a gap goes to control-detail | (relies on Flow 4 for that page to be actionable) | | |
| 🟡 "Recent evidence" shows any evidence sorted DESC | Fine for now; consider "last 7 days" filter later | 🟡 | |

**Verify by**: upload evidence on `/evidence` → navigate back to `/dashboard` → new evidence appears in "Recent", evidence-count KPI +1. Approve a mapping → coverage % increases.

### Flow 3 — Evidence mapping

#### 3a — Upload → list refresh

| Gap | Fix | Frontend |
|---|---|:-:|
| 🔴 After a successful upload, the list doesn't include the new row | On upload success, replace `items` signal with the result of `api.list()` | ✓ |
| 🔴 No feedback that upload succeeded | Toast: "Uploaded {name}" using existing `ui-toast` | ✓ |

#### 3b — Map + AI analyze + approve

| Gap | Fix | Backend | Frontend |
|---|---|:-:|:-:|
| 🔴 "Confirm mapping" writes the mapping but the row shows no change | Toast "Mapped to {code}" + re-fetch list; show a "Mapped to" chip on the row | | ✓ |
| 🔴 "AI analyze" runs but the result is thrown away | Toast: "AI classified as {classification} (confidence {n}). Review on Control page →" with a link to `/controls/{controlId}` | | ✓ |
| 🔴 "Approve evidence" changes DB status but the badge doesn't refresh | Toast + re-fetch list | | ✓ |
| 🔴 No column showing which controls a piece of evidence maps to | Extend `EvidenceResponse` DTO to include `mappings: [{controlCode, mappingType}]`; frontend renders as chips | ✓ | ✓ |

**Verify by**: upload a PDF → row appears → pick CC6.6 in the dropdown → click Confirm mapping → toast fires → row shows "Mapped to CC6.6" chip → navigate to `/dashboard` → CC6.6 shows COVERED. Then click "AI analyze" on another row → toast fires with the AI's classification + a link → click link → land on control detail.

### Flow 4 — Control panel / detail

This page is currently ~30 % built. The template exists but the action layer is missing.

| Gap | Fix | Backend | Frontend |
|---|---|:-:|:-:|
| 🔴 Mapped-evidence table doesn't show mapping type | Add a column showing `AI_SUGGESTED` (purple badge) vs `HUMAN_CONFIRMED` (green badge). Data is in `evidence_control_mappings.mapping_type` | 🟡 (extend response) | ✓ |
| 🔴 No AI Analysis panel | New card below the evidence table: title, reason text, confidence bar. Data: `GET /controls/{id}/ai-analyses` (new endpoint) returning the latest `ai_analysis` rows for controls with AI-suggested mappings | ✓ | ✓ |
| 🔴 No Confirm / Reject buttons on AI-suggested rows | For each row where `mapping_type === 'AI_SUGGESTED'`: two buttons. Confirm calls `POST /evidence/{evidenceId}/map` with `mappingType=HUMAN_CONFIRMED` (upserts). Reject calls new `DELETE /evidence/{evidenceId}/mappings/{controlId}` | 🟡 (verify + add delete) | ✓ |
| 🔴 No "Upload evidence" button on this page | Button that navigates to `/evidence?control={code}` so the Evidence page pre-selects that control in the dropdown when the user uploads | | ✓ |
| ⏭️ Comment field on review actions | Deferred — not required for basic flow |  |  |

**Verify by**: land on `/controls/CC6.1` (from the dashboard's gap table) → see AWS IAM Users row with "AI suggested" badge → see AI's reasoning panel below → click Confirm → row switches to "Human confirmed", control status flips to COVERED, toast confirms → back to dashboard, coverage % up.

## 4. Day-by-day plan

Ordered by dependency (backend endpoints before the UI that consumes them).

### Day 1 — Backend endpoints and Flow 1 (onboarding)

| Task | Effort | Blocks |
|---|---|---|
| Flyway `V15__organizations_onboarding.sql` — column + backfill | 30 min | ↓ |
| `OrganizationController` — `GET /organizations/current` returns `{id, name, onboardingCompleted, onboardingCompletedAt}` | 45 min | ↓ |
| `OrganizationController` — `POST /organizations/current/onboarding/complete` sets the flag + emits audit event | 30 min | Frontend |
| Extend `EvidenceResponse` DTO — include `mappings: [{controlId, controlCode, mappingType, classification, confidence}]` | 1 hour | Flow 3, 4 |
| Extend `ControlDetailResponse` — include `mappedEvidence: [{evidenceId, name, mappingType, classification, reason, confidence}]` | 1 hour | Flow 4 |
| New `DELETE /api/v1/evidence/{id}/mappings/{controlId}` — remove a mapping, emit audit event | 45 min | Flow 4 |
| Extend `AiAnalysisController` — `GET /controls/{controlId}/ai-analyses` (verify if it exists; may already) | 30 min | Flow 4 |
| Frontend: auth guard reads `onboardingCompleted`; redirects to `/onboarding` if false; caches org | 45 min | Flow 1 |
| Frontend: onboarding "Finish setup" button on step 5 → POST complete → navigate to `/dashboard` | 30 min | Flow 1 |
| Rebuild + manual verify onboarding gate end-to-end | 30 min |  |

**End-of-day check**: fresh signup redirects to `/onboarding`; completing the last step marks it done; subsequent logins land on `/dashboard`.

### Day 2 — Flows 2 and 3a (dashboard + evidence upload feedback)

| Task | Effort |
|---|---|
| Frontend: dashboard component subscribes to `router.events`; on navigation-in, re-fetches summary/gaps/recent | 1 hour |
| Frontend: evidence upload success → toast + `items.set(await api.list())` | 1 hour |
| Frontend: evidence map / approve / analyze success handlers → toast + re-fetch | 2 hours |
| Frontend: add "Mapped to" chips column to evidence table using new DTO field | 1 hour |
| Frontend: AI analyze toast includes clickable link to `/controls/{code}` when a mapping was suggested | 45 min |

**End-of-day check**: uploading a PDF immediately shows the row; clicking "AI analyze" toasts with a link; clicking the link opens the right control detail.

### Day 3 — Flow 4 (control detail actions)

| Task | Effort |
|---|---|
| Frontend: control-detail — show mapping type badge on each row (`AI_SUGGESTED` = purple, `HUMAN_CONFIRMED` = green) | 1 hour |
| Frontend: control-detail — Confirm / Reject buttons for AI-suggested rows; wire to POST/DELETE endpoints | 2 hours |
| Frontend: control-detail — AI Analysis card (title, reason, confidence bar) fetched from `GET /controls/{id}/ai-analyses` | 2 hours |
| Frontend: control-detail — "Upload evidence" button routes to `/evidence?control={code}` | 30 min |
| Frontend: evidence page — read `?control=X` query param and pre-select in the "Map to control" dropdown for new uploads | 30 min |

**End-of-day check**: from the dashboard gap table, click a NEEDS_REVIEW control → see AI reasoning → click Confirm → control status flips to COVERED → back button to dashboard shows coverage % updated.

### Day 4 — End-to-end walkthrough + polish + publish

| Task | Effort |
|---|---|
| Wipe volumes, fresh signup, walk through all 4 flows without notes | 30 min |
| Fix whatever is broken from the walkthrough | up to 4 hours |
| Regression check: existing demo tenant still works after new DTO fields | 30 min |
| Rebuild backend + frontend images, tag `0.6.0`, push | 1 hour |
| Update [STATUS.md](STATUS.md) and [ROADMAP.md](ROADMAP.md) Phase A → Phase B transition markers | 30 min |

**End-of-day check**: a stranger with no product knowledge can perform the Success Test in §6 below without asking questions.

## 5. What's explicitly out of scope for this sprint

Recorded here so nothing gets pulled in:

- Reviewer inbox page (a separate `/review` page listing all pending AI-suggested mappings)
- Real-time updates via SSE / WebSockets
- Collection progress UI (per-item status inside a running collection)
- Comments on review actions
- AI analysis history (only the latest analysis per (evidence, control) shows)
- Multi-control mapping in one action (map one at a time)
- Reject with reason (just reject; no textarea)
- Undo
- Row-level animations
- Onboarding step re-ordering
- Custom controls / custom frameworks

Every one of these multiplies the scope. Adding any of them is a separate ticket.

## 6. Success test

At the end of Day 4, a brand-new user must be able to, in one session, without any docs:

1. Register at `/register`
2. Land on `/onboarding`, walk through 5 steps (each step's CTA button navigates and returns)
3. Click "Finish setup" — arrive on `/dashboard` with 0 % coverage
4. Navigate to `/evidence`, drop in a PDF
5. See the new evidence row appear (with a "Mapped to (none)" chip)
6. Click "AI analyze" on that row — see a toast: "AI classified as PARTIAL (confidence 0.72). Review on Control page →"
7. Click the toast link — land on `/controls/CC6.3` (or whichever the AI picked)
8. See the AI's reasoning card and the evidence in the mapped table
9. Click "Confirm" on the AI-suggested mapping
10. See the mapping badge flip to `HUMAN_CONFIRMED`, the control status flip to `COVERED`, toast confirms
11. Navigate back to `/dashboard` — coverage % has increased from 0 % → 7 %

If steps 1-11 flow without the user asking *"did that work?"* — the sprint is done.

## 7. What this sprint does NOT fix

Documented for expectation management:

- The AI classification is still from the stub provider until M2 lands — reviewers may see the same PARTIAL/0.72 output for wildly different evidence.
- The RAG citations panel on control-detail is not built (that's M5).
- Scheduled collection is still manual-trigger only (that's M8).
- No password reset flow.
- No email confirmation on signup.

None of these block the four core flows from being demonstrably functional.

## 8. Cost vs. return

| Metric | Before | After |
|---|---|---|
| First-time user can complete signup → coverage without asking | ❌ | ✅ |
| Reviewer can act on an AI suggestion in the UI | ❌ | ✅ |
| Dashboard reflects actions taken elsewhere | ❌ | ✅ |
| Onboarding is a real gate | ❌ | ✅ |
| Every mutation has visible feedback | ❌ | ✅ |
| Demo doesn't need narration ("watch, the button *actually* worked") | ❌ | ✅ |

**4 working days**. Roughly 1 backend engineer-day + 3 frontend-days worth of work. No new architecture. No new external dependencies. One database column.

This sprint is the cheapest single unlock for perceived product quality on the current roadmap.

## 9. Where this fits in the roadmap

Slot between Phase A (immediate) and Phase B (M1–M10). The M1 milestone (onboarding gate) is fully absorbed by Day 1 of this sprint. The rest of Phase B (M2–M10) continues from where this sprint ends, unchanged.

If [ROADMAP.md](ROADMAP.md) is updated, this becomes **Phase A.5 — Core flows wiring**. Duration: 1 week. Prerequisite: Phase A appliance push + git set-up. Blocks: nothing further; M2 onwards proceed in parallel with any leftover UX polish.
