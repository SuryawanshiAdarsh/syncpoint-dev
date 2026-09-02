/**
 * Small pure functions for consistent visual mapping of enum values.
 * Backed by status-meta.ts + captions.ts — single source of truth.
 */
import { CAPTIONS } from '../captions';
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
