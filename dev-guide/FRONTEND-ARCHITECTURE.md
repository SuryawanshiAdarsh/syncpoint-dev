# Frontend UI Architecture

> Working notes for the agent / future engineers. Not user documentation.

## Layered design

```
┌──────────────────────────────────────────────────────────────────┐
│  Layer 3 — Feature components                                    │
│  src/app/features/<feature>/*.component.ts                       │
│  Business logic. Should NOT contain design tokens or magic colors.│
└─────────────────────┬────────────────────────────────────────────┘
                      │  imports
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 2 — Shared UI primitives                                  │
│  src/app/shared/ui/*.component.ts                                │
│  ui-button, ui-card, ui-badge, ui-page-header, ui-search, …      │
│  Every visual pattern used by 2+ pages MUST live here.           │
└─────────────────────┬────────────────────────────────────────────┘
                      │  reads
                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  Layer 1 — Design tokens                                         │
│  src/styles.scss   (CSS custom properties)                       │
│  --color-primary, --space-*, --radius-*, --shadow-*, --text-*.   │
│  Change here to repaint the whole app.                           │
└──────────────────────────────────────────────────────────────────┘
```

## Rules of thumb

1. **Feature components** own layout that is unique to that page. They import
   primitives from `@ui` and business services from `@core/*`. They should
   never hard-code colours, spacing, or badge styles.
2. **Shared primitives** own visual patterns that reappear across pages.
   Every primitive:
   - is a standalone Angular component
   - has typed `@Input`s (no `any`)
   - reads colours/spacing from CSS custom properties, never from hex literals
   - is exported from `src/app/shared/ui/index.ts` (barrel)
3. **Design tokens** are the only place hex/pixel values live.

## Path aliases (see `tsconfig.json`)

- `@ui`         → `src/app/shared/ui/index.ts`   (barrel)
- `@ui/*`       → `src/app/shared/ui/*`
- `@core/*`     → `src/app/core/*`
- `@features/*` → `src/app/features/*`
- `@env/*`      → `src/environments/*`

Example:

```ts
import { UiPageHeaderComponent, UiCardComponent } from '@ui';
import { ApiService } from '@core/api/api.service';
```

## Component catalogue (as of this pass)

### Structural
| Component             | Purpose                                                     |
|-----------------------|-------------------------------------------------------------|
| `ui-page-header`      | Eyebrow + title + subtitle + right-side action slot         |
| `ui-card`             | Bordered card w/ optional title + caption + `[header-actions]` slot; `padding="normal|tight|flush"` |
| `ui-toolbar`          | Flex row with `[leading]` and `[trailing]` slots; forces child form fields to 44px so alignment is automatic |
| `ui-empty-state`      | Icon tile + title + description + action slot for empty tables |

### Feedback
| Component  | Purpose                                                            |
|------------|--------------------------------------------------------------------|
| `ui-badge` | Semantic pill: `covered / partial / missing / needs-review / success / running / …` |
| `ui-toast` | Inline banner: `success / error / warning / info`                 |

### Domain-shaped (thin wrappers over ui-badge / provider metadata)
| Component                     | Purpose                                             |
|-------------------------------|-----------------------------------------------------|
| `ui-control-status-badge`     | `[status]="'COVERED'|'PARTIAL'|'MISSING'|'NEEDS_REVIEW'"` |
| `ui-evidence-status-badge`    | `[status]="'COLLECTED'|'APPROVED'|…"`               |
| `ui-freshness-badge`          | `[freshness]="'CURRENT'|'EXPIRING'|'EXPIRED'"`      |
| `ui-source-pill`              | Icon + label for evidence source type               |
| `ui-provider-logo`            | Coloured branded logo tile per integration provider  |

### Inputs & interaction
| Component            | Purpose                                                            |
|----------------------|--------------------------------------------------------------------|
| `ui-button`          | `variant="primary|ghost|danger|inverse"`, `size="sm|md|lg"`, `[loading]`, `loadingText` |
| `ui-search`          | Borderless search box; 44 px height (aligns with `mat-form-field appearance="outline"`) |
| `ui-filter-chips`    | Chip row bound to `[(selected)]`; chips carry `key`, `label`, `count`, optional `colorDot` |
| `ui-avatar`          | Gradient circle with initials from `[name]`                        |
| `ui-icon-tile`       | Tinted square/round icon container (variants: `brand`, `success`, `warning`, `danger`, `info`, `neutral`, `dark`, `gradient`) |

### Types & metadata
| Symbol                     | Purpose                                     |
|----------------------------|---------------------------------------------|
| `IntegrationProvider`      | `'GITHUB' | 'AWS' | 'JIRA' | 'GOOGLE_WORKSPACE'` |
| `ProviderMeta`             | Provider display metadata                   |
| `PROVIDER_CATALOG`         | Canonical readonly list of providers        |

## How to change look-and-feel across the whole app

- **Change primary brand colour** → edit `--color-primary` in `styles.scss`.
- **Change button radius** → edit `.btn.primary` in `ui-button.component.ts` OR `--radius-md`.
- **Add a new status colour** → add a `--color-<name>-*` token trio + a variant in `ui-badge.component.ts`.
- **Introduce a new page pattern that will repeat** → build a `ui-*` primitive; do NOT inline it in a feature page.

## Anti-patterns to avoid

- ❌ Hex colours inside `features/*` templates or component styles.
- ❌ Duplicating a `.card`-like block; use `ui-card`.
- ❌ Inline `<button class="btn primary">` in feature templates; use `ui-button`.
- ❌ Recreating a status badge with `[class]="statusClass(s)"`; use the domain-shaped badges (`ui-control-status-badge` etc.).
- ❌ Reaching into Angular Material internals via `::ng-deep` in feature pages. If a Material override is needed globally, put it in `styles.scss`.

## Where to put a new pattern

Ask yourself:
1. Does this visual pattern appear on more than one page? →
   **Yes**: build a `ui-*` primitive under `src/app/shared/ui/` and add to the barrel.
   **No**: keep it in the feature component's styles, using tokens.
2. Does it need business logic (fetch, mutation)? →
   **Yes**: business logic goes in `@core/api/api.service.ts`. The primitive is presentation-only.
   **No**: fine as a pure presentational component.

## Migration status (2026-09-01)

| Page                | Uses `ui-*` primitives | Notes                                     |
|---------------------|:----------------------:|-------------------------------------------|
| Login               | ⏳ partial              | Split hero, custom form                   |
| Register            | ⏳ partial              | Split hero, custom form                   |
| Shell               | Custom (rich)          | Sidebar + header; uses its own SVG brand  |
| Dashboard           | ⏳ partial              | Custom coverage ring + KPI cards          |
| **Controls**        | ✅ **migrated**         | Page header, toolbar, filter chips, empty state, control-status badge |
| Control detail      | ⏳ partial              |                                           |
| Evidence            | ⏳ partial              |                                           |
| **Integrations**    | ✅ **migrated**         | Provider logo, badge, button, card, toast, empty state |
| Onboarding          | ⏳ partial              |                                           |
| Ask AI              | ⏳ partial              | Custom chat UI                            |
| Export              | ⏳ partial              |                                           |

Ongoing work: sweep remaining pages one at a time. Each sweep should remove
inline `.card` / `.badge` / custom buttons / custom empty states and replace
them with the corresponding `ui-*` primitive.
