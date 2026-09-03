# Scheduled Collection + Organization Settings — Approach & Implementation

> Companion to [ROADMAP.md](ROADMAP.md) (this is Workflow 2 / M8, pulled forward) and
> [CORE-FLOWS-WIRING.md](CORE-FLOWS-WIRING.md) (same "make it actually work end-to-end" spirit).
> Captures the design decisions made while building this so they don't get re-litigated later.

## 1. Why this exists

Two gaps identified in the same working session:

1. **"Collect" is not automated.** The product's own tagline is "compliance evidence, automated,"
   but today evidence collection only happens when a human clicks "Collect now." The `schedule`
   field (`MANUAL` / `DAILY` / `WEEKLY`) already exists on `Integration` and is rendered nowhere,
   changeable nowhere, and acted on by nothing.
2. **There is no admin-facing settings surface**, even though the backend already has fully-built,
   currently unexposed endpoints for organization name and member/role management
   (`OrganizationController`). `CAPTIONS.common.settings` existed as an unused string — this page
   was clearly planned but never built.

Both are solved together because the schedule picker needs a home, and "Settings" is the correct
home for org-level configuration (not the Integrations page, which is about connection state, not
policy).

## 2. Decisions made (and why)

| Decision | Reasoning |
|---|---|
| Sequencing: Workflow 2 (Collect) before AI (M2) | Stub LLM is deterministic and contract-compatible with the real provider already (`build_llm()` factory exists) — no rework cost to deferring AI. Avoids paying for OpenAI calls during heavy iteration on unrelated workflows. Avoids a flaky external dependency breaking early demos. |
| Schedule sweep is a **separate, tenant-free code path**, not a reuse of the manual "Collect now" trigger | `IntegrationService.triggerCollection()` depends on `TenantContext.require()` (a per-request ThreadLocal). A `@Scheduled` background job has no request, no logged-in user, no tenant context. Reusing the manual path would throw. New method `triggerScheduledCollection(Integration)` uses `integration.getCreatedBy()` as the audit actor instead. |
| Sweep queries **across all tenants** in one job | This is a system-level cron, not a per-tenant operation — one bean, one schedule, iterates every organization's due integrations. Correct and standard for this kind of background job. |
| Overlap protection: skip if a run is already `QUEUED`/`RUNNING` | Confirmed with the user. Prevents duplicate concurrent collections against the same integration if a previous run is still in flight when the next sweep fires. |
| Sweep interval configurable via `application.yml`, not hardcoded | Confirmed with the user ("should be configurable"). Uses a Spring property placeholder directly in `@Scheduled(cron = "${syncpoint.collection.sweep-cron:0 0 * * * *}")` — idiomatic Spring, no new `@ConfigurationProperties` record needed for a single cron string. |
| Settings page lives behind the **account dropdown menu**, not the main sidebar | Org-level admin config is not a daily workflow page (unlike Dashboard/Evidence/Controls) — matches standard SaaS IA (settings under the avatar menu, not primary nav). |
| Settings page has 3 sections: General / Members / Automation | General + Members expose already-built, already-secured backend endpoints that had zero frontend surface. Automation is the schedule picker this task actually needs. Bundling them avoids building three separate one-off pages later. |
| Frontend role-gating is UX only, not the security boundary | The real enforcement is backend `@PreAuthorize` (already exists on every mutating org/member endpoint). The frontend just hides controls a REVIEWER/VIEWER can't use — defense in depth, not the primary control. |

## 3. Backend changes

### 3.1 Scheduled collection

| File | Change |
|---|---|
| `AuditEvents.java` | add `INTEGRATION_SCHEDULE_UPDATED` |
| `IntegrationRepository.java` | add `findByStatusAndScheduleNot(IntegrationStatus, IntegrationSchedule)` — sweep candidates |
| `CollectionRunRepository.java` | add `existsByIntegrationIdAndStatusIn(UUID, Collection<CollectionRunStatus>)` — overlap guard |
| `IntegrationService.java` | add `updateSchedule(UUID, IntegrationSchedule)` (tenant-scoped, audited, OWNER/ADMIN) and `triggerScheduledCollection(Integration)` (tenant-free, used only by the sweep) |
| `IntegrationController.java` | add `PATCH /api/v1/integrations/{id}/schedule` |
| `ScheduledCollectionSweep.java` (new) | `@Component`, `@Scheduled(cron = "${syncpoint.collection.sweep-cron:0 0 * * * *}")`. For each `CONNECTED` integration with `schedule != MANUAL`: skip if already in flight, skip if not yet due (`DAILY` → `lastCollectionAt` older than 24h or null; `WEEKLY` → older than 7 days or null), otherwise call `triggerScheduledCollection`. Catches and logs per-integration failures so one bad integration doesn't kill the sweep. |
| `ComplianceApplication.java` | add `@EnableScheduling` |
| `application.yml` | document `syncpoint.collection.sweep-cron` (default: hourly) |

### 3.2 Organization settings

No backend changes — `OrganizationController` / `OrganizationService` already implement everything
needed (`GET/PATCH /organizations/current`, `GET/POST /organizations/current/members`,
`PATCH /organizations/current/members/{id}`), already correctly `@PreAuthorize`-gated.

## 4. Frontend changes

| File | Change |
|---|---|
| `api.types.ts` | add `Organization`, `Member` interfaces |
| `api.service.ts` | add `organization()`, `updateOrganization()`, `members()`, `addMember()`, `updateMemberRole()`, `updateIntegrationSchedule()` |
| `features/settings/settings.component.ts` (new) | General / Members / Automation sections using the shared `@ui` primitive library; role-gated (OWNER/ADMIN see full page, others see a restricted empty state) |
| `app.routes.ts` | add `/settings` route |
| `shell.component.ts` | add "Settings" item to the account dropdown menu |
| `captions.ts` | new `settings` caption section |

## 5. Verification plan

1. Backend compiles clean; `docker compose build backend frontend` succeeds.
2. As OWNER: visit `/settings`, confirm org name renders, change it, confirm it persists (`GET /organizations/current` reflects the new name).
3. As OWNER: invite a member, confirm it appears in the Members list with the chosen role.
4. As OWNER: change an integration's schedule to `DAILY`, confirm `PATCH /integrations/{id}/schedule` persists it (`GET /integrations` reflects the change).
5. Manually trigger the sweep logic (or wait for the cron) and confirm a `DAILY` integration with a `lastCollectionAt` older than 24h gets a new `CollectionRun` with `trigger=SCHEDULED` in its audit metadata, without a logged-in user.
6. Confirm a `MANUAL` integration is never swept, and a `DAILY` integration with a `QUEUED`/`RUNNING` run in flight is skipped on that sweep pass.
7. As REVIEWER: visit `/settings`, confirm the restricted empty state shows instead of the full page.

## 6. Out of scope for this pass

- Per-tenant configurable sweep cadence (the sweep interval is a global ops setting; the *per-integration* DAILY/WEEKLY choice is what's user-facing)
- Removing a member (only role change + invite are in scope)
- Organization deletion (already exists elsewhere, not part of Settings)
- Notification preferences / email digests (not built anywhere yet, separate feature)
