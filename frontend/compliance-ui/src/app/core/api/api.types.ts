export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface Me {
  userId: string;
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  role: 'OWNER' | 'ADMIN' | 'REVIEWER' | 'VIEWER';
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
