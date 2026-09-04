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
  onboardingCompleted: boolean;
  emailVerified: boolean;
  platformAdmin: boolean;
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

export interface EvidenceVersion {
  id: string;
  version: number;
  sizeBytes: number;
  mimeType?: string;
  contentHash: string;
  collectedAt: string;
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

// Platform admin console (internal Syncpoint-the-company view of its own tenants)
export type SubscriptionPlan = 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'SUSPENDED';

export interface AdminOrganizationSummary {
  organizationId: string;
  name: string;
  slug: string;
  createdAt: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  seatLimit?: number;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  userCount: number;
  evidenceCount: number;
  integrationCount: number;
  connectedIntegrationCount: number;
  coveragePercent: number;
}

export interface AdminMemberSummary {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface AdminOrganizationDetail {
  summary: AdminOrganizationSummary;
  members: AdminMemberSummary[];
}

export interface UpdateSubscriptionRequest {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  seatLimit?: number | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
}

/** Tenant-facing view of the caller's own organization subscription (Settings > Billing). */
export interface SubscriptionResponse {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  seatLimit?: number;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canRequestChange: boolean;
}

export type SubscriptionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';

export interface CreateSubscriptionRequestBody {
  requestedPlan: SubscriptionPlan;
  requestedSeatLimit: number;
  note?: string;
}

/** Tenant-facing view of one of the org's own subscription requests. */
export interface SubscriptionRequestResponse {
  id: string;
  requestedPlan: SubscriptionPlan;
  requestedSeatLimit: number;
  note?: string;
  status: SubscriptionRequestStatus;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

/** Admin-facing view of a subscription request, enriched with org + requester identity. */
export interface AdminSubscriptionRequestResponse {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  currentPlan?: SubscriptionPlan;
  currentSeatLimit?: number;
  requestedByName: string;
  requestedByEmail: string;
  requestedPlan: SubscriptionPlan;
  requestedSeatLimit: number;
  note?: string;
  status: SubscriptionRequestStatus;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
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
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
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

export interface CoverageTrendPoint {
  date: string;
  covered: number;
  partial: number;
  missing: number;
  needsReview: number;
  coveragePercent: number;
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

export interface AuditEvent {
  id: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  actorName?: string;
  actorEmail?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
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
