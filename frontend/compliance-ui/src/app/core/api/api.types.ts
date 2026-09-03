export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export type Role = 'OWNER' | 'ADMIN' | 'REVIEWER' | 'VIEWER';

export interface Me {
  userId: string;
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  role: Role;
}

export type ControlStatus = 'COVERED' | 'PARTIAL' | 'MISSING' | 'NEEDS_REVIEW';

export interface Framework {
  id: string;
  code: string;
  name: string;
  version: string;
  active: boolean;
}

export interface Control {
  id: string;
  frameworkId: string;
  frameworkCode: string;
  code: string;
  title: string;
  description: string;
  category: string;
  status: ControlStatus;
}

export type EvidenceSourceType = 'MANUAL_UPLOAD' | 'GITHUB' | 'AWS' | 'JIRA' | 'GOOGLE_WORKSPACE';
export type EvidenceStatus = 'COLLECTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type FreshnessState = 'CURRENT' | 'EXPIRING' | 'EXPIRED';

export interface Evidence {
  id: string;
  name: string;
  description?: string;
  sourceType: EvidenceSourceType;
  sourceSystem: string;
  status: EvidenceStatus;
  freshness: FreshnessState;
  collectedAt: string;
  expiresAt?: string;
  latestVersion?: number;
  contentHash?: string;
  sizeBytes?: number;
  mimeType?: string;
  createdAt: string;
  mapped: boolean;
  mappingCount: number;
  lowestConfidence?: number;
}

export type MappingType = 'AI_SUGGESTED' | 'HUMAN_CONFIRMED' | 'HUMAN_REJECTED';
export type Classification = 'COVERED' | 'PARTIAL' | 'INSUFFICIENT';

export interface Mapping {
  id: string;
  evidenceId: string;
  controlId: string;
  controlCode?: string;
  mappingType: MappingType;
  classification?: Classification;
  confidence?: number;
  reason?: string;
  createdAt: string;
}

/** One row of the Control Detail "mapped evidence" table — mapping + evidence summary joined. */
export interface ControlMapping {
  mappingId: string;
  evidenceId: string;
  evidenceName: string;
  sourceType?: EvidenceSourceType;
  sourceSystem?: string;
  evidenceStatus?: EvidenceStatus;
  freshness?: FreshnessState;
  collectedAt?: string;
  mappingType: MappingType;
  classification?: Classification;
  confidence?: number;
  reason?: string;
  mappedAt: string;
}

/** AI reasoning summary for the Control Detail "AI analysis" panel. */
export interface AiAnalysisSummary {
  id: string;
  evidenceId: string;
  evidenceName: string;
  provider: string;
  model: string;
  promptVersion: string;
  classification?: Classification;
  confidence?: number;
  reason?: string;
  createdAt: string;
}

export interface Integration {
  id: string;
  provider: 'GITHUB' | 'AWS' | 'JIRA' | 'GOOGLE_WORKSPACE';
  status: 'PENDING' | 'CONNECTED' | 'ERROR' | 'DISCONNECTED';
  displayName?: string;
  configuration: Record<string, unknown>;
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY';
  lastTestedAt?: string;
  lastTestMessage?: string;
  lastCollectionAt?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Member {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface DashboardSummary {
  totalControls: number;
  byStatus: Record<ControlStatus, number>;
  coveragePercent: number;
  totalEvidence: number;
  totalIntegrations: number;
  connectedIntegrations: number;
}

export interface ControlGap {
  controlId: string;
  code: string;
  title: string;
  category: string;
  status: ControlStatus;
}

export type CollectionRunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
export type CollectionTrigger = 'MANUAL' | 'SCHEDULED';
export type CollectionItemStatus = 'SUCCESS' | 'SKIPPED' | 'FAILED';

export interface CollectionRun {
  id: string;
  integrationId: string;
  status: CollectionRunStatus;
  trigger: CollectionTrigger;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  createdAt: string;
  itemsOk: number;
  itemsFailed: number;
  itemsTotal: number;
  durationMs?: number;
}

export interface CollectionItem {
  id: string;
  evidenceType: string;
  status: CollectionItemStatus;
  message?: string;
  evidenceId?: string;
  createdAt: string;
}

export interface CollectionRunDetail {
  run: CollectionRun;
  items: CollectionItem[];
}

export interface ExportJob {
  id: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  sizeBytes?: number;
  downloadPath?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}
