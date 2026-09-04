/**
 * Small pure functions for consistent visual mapping of enum values.
 * Backed by status-meta.ts + captions.ts — single source of truth.
 */
import { CAPTIONS } from '../captions';
import type { UiBadgeVariant } from '../ui/ui-badge.component';
import {
  CONTROL_STATUS_META,
  EVIDENCE_STATUS_META,
  EVIDENCE_SOURCE_META,
  FRESHNESS_META,
  INTEGRATION_STATUS_META,
  MAPPING_TYPE_META,
  UNKNOWN_META,
  type StatusVisual,
} from './status-meta';

// ─── Semantic color → CSS custom property ──────────────────────────
// Single place mapping a StatusVisual's semantic color name to the actual
// design-token variable, so charts/SVG (which can't use the .success/.warning
// CSS classes) still draw from the same palette as every badge/tile.
const SEMANTIC_COLOR_VAR: Readonly<Record<StatusVisual['color'], string>> = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger:  'var(--color-danger)',
  info:    'var(--color-info)',
  brand:   'var(--color-primary)',
  neutral: 'var(--color-text-muted)',
};
export function statusColorVar(visual: StatusVisual): string {
  return SEMANTIC_COLOR_VAR[visual.color];
}

// ─── Control status ─────────────────────────────────────────────────
export function controlStatusMeta(code: string): StatusVisual {
  return CONTROL_STATUS_META[code] ?? UNKNOWN_META;
}

// ─── Evidence status ────────────────────────────────────────────────
export function evidenceStatusMeta(code: string): StatusVisual {
  return EVIDENCE_STATUS_META[code] ?? UNKNOWN_META;
}

// ─── Evidence source ────────────────────────────────────────────────
export function evidenceSourceMeta(code: string): StatusVisual {
  return EVIDENCE_SOURCE_META[code] ?? UNKNOWN_META;
}
export function evidenceSourceIcon(code: string): string {
  return evidenceSourceMeta(code).icon;
}
export function evidenceSourceLabel(code: string): string {
  return ({
    MANUAL_UPLOAD:    'Manual upload',
    GITHUB:           'GitHub',
    AWS:              'AWS',
    JIRA:             'Jira',
    GOOGLE_WORKSPACE: 'Google Workspace',
  } as Record<string, string>)[code] ?? code;
}

// ─── Freshness ──────────────────────────────────────────────────────
export function freshnessMeta(code: string): StatusVisual {
  return FRESHNESS_META[code] ?? UNKNOWN_META;
}
export function freshnessLabel(code: string): string {
  const labels = CAPTIONS.status as Readonly<Record<string, string>>;
  return labels[code] ?? code;
}

// ─── Integration status ─────────────────────────────────────────────
export function integrationStatusMeta(code: string): StatusVisual {
  return INTEGRATION_STATUS_META[code] ?? UNKNOWN_META;
}

// ─── Mapping type ───────────────────────────────────────────────────
export function mappingTypeMeta(code: string): StatusVisual {
  return MAPPING_TYPE_META[code] ?? UNKNOWN_META;
}

// ─── Legacy CSS class helpers (kept for existing .badge.covered etc.) ────
// The pages still use hand-tuned CSS classes for badges. Map the code to the
// existing class name so we can retire the duplicated methods across pages.
export function controlStatusClass(code: string): string {
  return ({
    COVERED:      'covered',
    PARTIAL:      'partial',
    MISSING:      'missing',
    NEEDS_REVIEW: 'needs-review',
  } as Record<string, string>)[code] ?? '';
}
export function evidenceStatusClass(code: string): string {
  return ({
    APPROVED:     'approved',
    COLLECTED:    'pending',
    UNDER_REVIEW: 'running',
    REJECTED:     'rejected',
    EXPIRED:      'error',
  } as Record<string, string>)[code] ?? '';
}
export function freshnessClass(code: string): string {
  return ({
    CURRENT:  'covered',
    EXPIRING: 'partial',
    EXPIRED:  'missing',
  } as Record<string, string>)[code] ?? '';
}

// ─── Subscription plan / status (Settings > Billing, Admin console) ────────
const SUBSCRIPTION_STATUS_BADGE_VARIANT: Readonly<Record<string, UiBadgeVariant>> = {
  TRIALING:  'info',
  ACTIVE:    'success',
  PAST_DUE:  'warning',
  CANCELED:  'neutral',
  SUSPENDED: 'error',
};
export function subscriptionStatusBadgeVariant(status: string): UiBadgeVariant {
  return SUBSCRIPTION_STATUS_BADGE_VARIANT[status] ?? 'neutral';
}
export function subscriptionStatusLabel(status: string): string {
  return (CAPTIONS.admin as Record<string, string>)[`SUB_${status}`] ?? status;
}
export function subscriptionPlanLabel(plan: string): string {
  return (CAPTIONS.admin as Record<string, string>)[`PLAN_${plan}`] ?? plan;
}

const SUBSCRIPTION_REQUEST_STATUS_BADGE_VARIANT: Readonly<Record<string, UiBadgeVariant>> = {
  PENDING:  'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELED: 'neutral',
};
export function subscriptionRequestStatusBadgeVariant(status: string): UiBadgeVariant {
  return SUBSCRIPTION_REQUEST_STATUS_BADGE_VARIANT[status] ?? 'neutral';
}
export function subscriptionRequestStatusLabel(status: string): string {
  return (CAPTIONS.admin as Record<string, string>)[`REQ_${status}`] ?? status;
}
