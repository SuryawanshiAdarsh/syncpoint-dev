/**
 * Display metadata for enum values — the mapping between a code
 * (`'COVERED'`) and its visual representation (color + icon).
 *
 * Companion to enums.ts (the values) and captions.ts (the labels).
 */
import {
  CONTROL_STATUS,
  EVIDENCE_STATUS,
  EVIDENCE_SOURCE,
  FRESHNESS,
  INTEGRATION_STATUS,
  INTEGRATION_SCHEDULE,
  MAPPING_TYPE,
  COLLECTION_RUN_STATUS,
  EXPORT_JOB_STATUS,
} from './enums';

export interface StatusVisual {
  /** CSS variable name suffix; e.g. 'success' → `var(--color-success)`. */
  color: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
  /** Material Icons Round name. */
  icon: string;
}

export const CONTROL_STATUS_META: Readonly<Record<string, StatusVisual>> = {
  [CONTROL_STATUS.COVERED]:      { color: 'success', icon: 'check_circle' },
  [CONTROL_STATUS.PARTIAL]:      { color: 'warning', icon: 'hourglass_top' },
  [CONTROL_STATUS.NEEDS_REVIEW]: { color: 'brand',   icon: 'reviews' },
  [CONTROL_STATUS.MISSING]:      { color: 'danger',  icon: 'error' },
};

export const EVIDENCE_STATUS_META: Readonly<Record<string, StatusVisual>> = {
  [EVIDENCE_STATUS.COLLECTED]:    { color: 'info',    icon: 'inventory_2' },
  [EVIDENCE_STATUS.UNDER_REVIEW]: { color: 'brand',   icon: 'reviews' },
  [EVIDENCE_STATUS.APPROVED]:     { color: 'success', icon: 'verified' },
  [EVIDENCE_STATUS.REJECTED]:     { color: 'danger',  icon: 'block' },
  [EVIDENCE_STATUS.EXPIRED]:      { color: 'neutral', icon: 'schedule' },
};

export const FRESHNESS_META: Readonly<Record<string, StatusVisual>> = {
  [FRESHNESS.CURRENT]:  { color: 'success', icon: 'check' },
  [FRESHNESS.EXPIRING]: { color: 'warning', icon: 'schedule' },
  [FRESHNESS.EXPIRED]:  { color: 'danger',  icon: 'error' },
};

export const EVIDENCE_SOURCE_META: Readonly<Record<string, StatusVisual>> = {
  [EVIDENCE_SOURCE.MANUAL_UPLOAD]:    { color: 'neutral', icon: 'upload_file' },
  [EVIDENCE_SOURCE.GITHUB]:           { color: 'neutral', icon: 'code' },
  [EVIDENCE_SOURCE.AWS]:              { color: 'warning', icon: 'cloud' },
  [EVIDENCE_SOURCE.JIRA]:             { color: 'info',    icon: 'bug_report' },
  [EVIDENCE_SOURCE.GOOGLE_WORKSPACE]: { color: 'info',    icon: 'groups' },
};

export const INTEGRATION_STATUS_META: Readonly<Record<string, StatusVisual>> = {
  [INTEGRATION_STATUS.PENDING]:      { color: 'warning', icon: 'schedule' },
  [INTEGRATION_STATUS.CONNECTED]:    { color: 'success', icon: 'link' },
  [INTEGRATION_STATUS.ERROR]:        { color: 'danger',  icon: 'error' },
  [INTEGRATION_STATUS.DISCONNECTED]: { color: 'neutral', icon: 'link_off' },
};

export const INTEGRATION_SCHEDULE_META: Readonly<Record<string, StatusVisual>> = {
  [INTEGRATION_SCHEDULE.MANUAL]: { color: 'neutral', icon: 'touch_app' },
  [INTEGRATION_SCHEDULE.DAILY]:  { color: 'brand',   icon: 'today' },
  [INTEGRATION_SCHEDULE.WEEKLY]: { color: 'brand',   icon: 'date_range' },
};

export const MAPPING_TYPE_META: Readonly<Record<string, StatusVisual>> = {
  [MAPPING_TYPE.AI_SUGGESTED]:    { color: 'brand',   icon: 'auto_awesome' },
  [MAPPING_TYPE.HUMAN_CONFIRMED]: { color: 'success', icon: 'verified' },
  [MAPPING_TYPE.HUMAN_REJECTED]:  { color: 'danger',  icon: 'block' },
};

export const COLLECTION_RUN_STATUS_META: Readonly<Record<string, StatusVisual>> = {
  [COLLECTION_RUN_STATUS.QUEUED]:    { color: 'neutral', icon: 'schedule' },
  [COLLECTION_RUN_STATUS.RUNNING]:   { color: 'info',    icon: 'sync' },
  [COLLECTION_RUN_STATUS.COMPLETED]: { color: 'success', icon: 'check_circle' },
  [COLLECTION_RUN_STATUS.PARTIAL]:   { color: 'warning', icon: 'warning' },
  [COLLECTION_RUN_STATUS.FAILED]:    { color: 'danger',  icon: 'error' },
};

export const EXPORT_JOB_STATUS_META: Readonly<Record<string, StatusVisual>> = {
  [EXPORT_JOB_STATUS.QUEUED]:    { color: 'neutral', icon: 'schedule' },
  [EXPORT_JOB_STATUS.RUNNING]:   { color: 'info',    icon: 'sync' },
  [EXPORT_JOB_STATUS.COMPLETED]: { color: 'success', icon: 'check_circle' },
  [EXPORT_JOB_STATUS.FAILED]:    { color: 'danger',  icon: 'error' },
};

/** Fallback when a code is unknown; keeps the UI from throwing. */
export const UNKNOWN_META: StatusVisual = { color: 'neutral', icon: 'help' };
