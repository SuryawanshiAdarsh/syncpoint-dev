# Syncpoint Dev Guide

Every planning, architecture, and status document lives here. If you're new to the project, read [ROADMAP.md](ROADMAP.md) first — it's the master plan and links to everything else.

## Read this first

1. **[ROADMAP.md](ROADMAP.md)** — where we are, what's next, how we get there. The master plan.

## By purpose

| Question | File |
|---|---|
| *Where is the project today?* | [STATUS.md](STATUS.md) |
| *What are the technical milestones (M1 → M10)?* | [MVP-COMPLETION-PLAN.md](MVP-COMPLETION-PLAN.md) |
| *What non-code work is needed for a first paying customer?* | [PATH-TO-FIRST-CUSTOMER.md](PATH-TO-FIRST-CUSTOMER.md) |
| *How is the code organized?* | [ARCHITECTURE.md](ARCHITECTURE.md) |
| *How is the frontend organized?* | [FRONTEND-ARCHITECTURE.md](FRONTEND-ARCHITECTURE.md) |
| *What phases has the project already been through?* | [BUILD-PLAN.md](BUILD-PLAN.md) |
| *What is the product, in plain English?* | [../PRODUCT.md](../PRODUCT.md) |
| *What is the MVP-completion spec?* | [../PROJECT_SPEC3.md](../PROJECT_SPEC3.md) |

## When to update which file

| Event | File(s) to update |
|---|---|
| Phase transition (A → B → C → …) | [ROADMAP.md](ROADMAP.md) §2, §6 |
| Milestone complete | [ROADMAP.md](ROADMAP.md) §2, [MVP-COMPLETION-PLAN.md](MVP-COMPLETION-PLAN.md) checklist, [STATUS.md](STATUS.md) |
| Layer or config contract changes | [ARCHITECTURE.md](ARCHITECTURE.md) |
| First customer feedback | [PATH-TO-FIRST-CUSTOMER.md](PATH-TO-FIRST-CUSTOMER.md), possibly [PRODUCT.md](../PRODUCT.md) |
| Weekly cadence (see [ROADMAP.md](ROADMAP.md) §8) | [STATUS.md](STATUS.md) |

## The full reading order (for a new contributor)

1. [../README.md](../README.md) — 2-minute quickstart
2. [../PRODUCT.md](../PRODUCT.md) — the product in plain English
3. [ROADMAP.md](ROADMAP.md) — where we are and where we're going
4. [ARCHITECTURE.md](ARCHITECTURE.md) — how the code is structured
5. [MVP-COMPLETION-PLAN.md](MVP-COMPLETION-PLAN.md) — the milestones you'll be working on
6. [PATH-TO-FIRST-CUSTOMER.md](PATH-TO-FIRST-CUSTOMER.md) — why the code is only 70 % of the job
7. [STATUS.md](STATUS.md) — the up-to-the-minute snapshot

Then: `docker compose up -d` from the repo root, log in as `demo-owner@syncpoint.local` / `demo-password-2026`, click every page.
