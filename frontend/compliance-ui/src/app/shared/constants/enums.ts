/**
 * Runtime constants that mirror the Java enums.
 *
 * The `api.types.ts` file has the string-literal *types* (e.g. `ControlStatus`).
 * This file has the string-literal *values* so components can compare against
 * `CONTROL_STATUS.COVERED` instead of the magic string `'COVERED'`.
 *
 * Sources of truth stay in the Java enums + Postgres CHECK constraints; these
 * constants must be kept aligned by convention. A future
 * `GET /api/v1/reference` endpoint will replace this file with server-driven
 * metadata.
 */

// ─── Access control ─────────────────────────────────────────────────
export const ROLE = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  REVIEWER: 'REVIEWER',
  VIEWER: 'VIEWER',
} as const;
export type Role = typeof ROLE[keyof typeof ROLE];

// ─── Control status (derived, not persisted) ────────────────────────
export const CONTROL_STATUS = {
  COVERED: 'COVERED',
  PARTIAL: 'PARTIAL',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  MISSING: 'MISSING',
} as const;
export type ControlStatusValue = typeof CONTROL_STATUS[keyof typeof CONTROL_STATUS];

// ─── Evidence ───────────────────────────────────────────────────────
export const EVIDENCE_SOURCE = {
  MANUAL_UPLOAD: 'MANUAL_UPLOAD',
  GITHUB: 'GITHUB',
  AWS: 'AWS',
  JIRA: 'JIRA',
  GOOGLE_WORKSPACE: 'GOOGLE_WORKSPACE',
} as const;
export type EvidenceSourceValue = typeof EVIDENCE_SOURCE[keyof typeof EVIDENCE_SOURCE];

export const EVIDENCE_STATUS = {
  COLLECTED: 'COLLECTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type EvidenceStatusValue = typeof EVIDENCE_STATUS[keyof typeof EVIDENCE_STATUS];

export const FRESHNESS = {
  CURRENT: 'CURRENT',
  EXPIRING: 'EXPIRING',
  EXPIRED: 'EXPIRED',
} as const;
export type FreshnessValue = typeof FRESHNESS[keyof typeof FRESHNESS];

// ─── Mapping ────────────────────────────────────────────────────────
export const MAPPING_TYPE = {
  AI_SUGGESTED: 'AI_SUGGESTED',
  HUMAN_CONFIRMED: 'HUMAN_CONFIRMED',
  HUMAN_REJECTED: 'HUMAN_REJECTED',
} as const;
export type MappingTypeValue = typeof MAPPING_TYPE[keyof typeof MAPPING_TYPE];

export const CLASSIFICATION = {
  COVERED: 'COVERED',
  PARTIAL: 'PARTIAL',
  INSUFFICIENT: 'INSUFFICIENT',
} as const;
export type ClassificationValue = typeof CLASSIFICATION[keyof typeof CLASSIFICATION];

// ─── Integrations ───────────────────────────────────────────────────
export const INTEGRATION_PROVIDER = {
  GITHUB: 'GITHUB',
  AWS: 'AWS',
  JIRA: 'JIRA',
  GOOGLE_WORKSPACE: 'GOOGLE_WORKSPACE',
} as const;
export type IntegrationProviderValue = typeof INTEGRATION_PROVIDER[keyof typeof INTEGRATION_PROVIDER];

export const INTEGRATION_STATUS = {
  PENDING: 'PENDING',
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR',
  DISCONNECTED: 'DISCONNECTED',
} as const;
export type IntegrationStatusValue = typeof INTEGRATION_STATUS[keyof typeof INTEGRATION_STATUS];

export const INTEGRATION_SCHEDULE = {
  MANUAL: 'MANUAL',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
} as const;
export type IntegrationScheduleValue = typeof INTEGRATION_SCHEDULE[keyof typeof INTEGRATION_SCHEDULE];

// ─── Collections ────────────────────────────────────────────────────
export const COLLECTION_RUN_STATUS = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  PARTIAL: 'PARTIAL',
  FAILED: 'FAILED',
} as const;
export type CollectionRunStatusValue = typeof COLLECTION_RUN_STATUS[keyof typeof COLLECTION_RUN_STATUS];

export const COLLECTION_ITEM_STATUS = {
  SUCCESS: 'SUCCESS',
  SKIPPED: 'SKIPPED',
  FAILED: 'FAILED',
} as const;
export type CollectionItemStatusValue = typeof COLLECTION_ITEM_STATUS[keyof typeof COLLECTION_ITEM_STATUS];

// ─── Export jobs ────────────────────────────────────────────────────
export const EXPORT_JOB_STATUS = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type ExportJobStatusValue = typeof EXPORT_JOB_STATUS[keyof typeof EXPORT_JOB_STATUS];

// ─── Audit event types (mirrors com.syncpoint.compliance.audit.AuditEvents) ──
export const AUDIT_EVENT = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  ONBOARDING_COMPLETED: 'ONBOARDING_COMPLETED',
  INTEGRATION_CREATED: 'INTEGRATION_CREATED',
  INTEGRATION_CONNECTED: 'INTEGRATION_CONNECTED',
  INTEGRATION_TESTED: 'INTEGRATION_TESTED',
  INTEGRATION_DISCONNECTED: 'INTEGRATION_DISCONNECTED',
  INTEGRATION_SCHEDULE_UPDATED: 'INTEGRATION_SCHEDULE_UPDATED',
  COLLECTION_STARTED: 'COLLECTION_STARTED',
  COLLECTION_COMPLETED: 'COLLECTION_COMPLETED',
  COLLECTION_FAILED: 'COLLECTION_FAILED',
  EVIDENCE_CREATED: 'EVIDENCE_CREATED',
  EVIDENCE_REVIEWED: 'EVIDENCE_REVIEWED',
  EVIDENCE_MAPPED: 'EVIDENCE_MAPPED',
  EVIDENCE_RENEWED: 'EVIDENCE_RENEWED',
  MAPPING_CONFIRMED: 'MAPPING_CONFIRMED',
  MAPPING_REJECTED: 'MAPPING_REJECTED',
  AI_ANALYSIS_CREATED: 'AI_ANALYSIS_CREATED',
  EXPORT_CREATED: 'EXPORT_CREATED',
} as const;
export type AuditEventValue = typeof AUDIT_EVENT[keyof typeof AUDIT_EVENT];
