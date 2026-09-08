import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Control, ControlGap, ControlMapping, AiAnalysisSummary, AuditEvent, CollectionRun, CollectionRunDetail,
  CoverageTrendPoint, DashboardSummary, Evidence, EvidenceVersion, ExportJob, Framework, Integration, Mapping, Me,
  Member, Organization, TokenResponse, Policy, PolicyDetail, PolicyPortalPage, PolicyPortalDetail, PolicyCoverage,
  AdminOrganizationSummary, AdminOrganizationDetail, UpdateSubscriptionRequest, SubscriptionResponse,
  CreateSubscriptionRequestBody, SubscriptionRequestResponse, AdminSubscriptionRequestResponse,
  Risk, RiskStatus, CreateRiskRequest, UpdateRiskRequest,
  ControlException, CreateControlExceptionRequest
} from './api.types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBase;

  // Auth
  register(body: { email: string; password: string; name: string; organizationName: string }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/auth/register`, body);
  }
  login(body: { email: string; password: string }): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/auth/login`, body);
  }
  me(): Observable<Me> { return this.http.get<Me>(`${this.base}/auth/me`); }
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/forgot-password`, { email });
  }
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/reset-password`, { token, newPassword });
  }
  acceptInvite(token: string, newPassword: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.base}/auth/accept-invite`, { token, newPassword });
  }
  verifyEmail(token: string): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/verify-email`, { token });
  }

  // Frameworks + controls
  frameworks(): Observable<Framework[]> { return this.http.get<Framework[]>(`${this.base}/frameworks`); }
  controls(): Observable<Control[]> { return this.http.get<Control[]>(`${this.base}/controls`); }
  control(id: string): Observable<Control> { return this.http.get<Control>(`${this.base}/controls/${id}`); }
  controlEvidence(id: string): Observable<Evidence[]> {
    return this.http.get<Evidence[]>(`${this.base}/controls/${id}/evidence`);
  }
  controlMappings(id: string): Observable<ControlMapping[]> {
    return this.http.get<ControlMapping[]>(`${this.base}/controls/${id}/mappings`);
  }
  controlAiAnalyses(id: string): Observable<AiAnalysisSummary[]> {
    return this.http.get<AiAnalysisSummary[]>(`${this.base}/controls/${id}/ai-analyses`);
  }

  // Evidence
  evidence(): Observable<Evidence[]> { return this.http.get<Evidence[]>(`${this.base}/evidence`); }
  evidenceById(id: string): Observable<Evidence> { return this.http.get<Evidence>(`${this.base}/evidence/${id}`); }
  uploadEvidence(form: FormData): Observable<Evidence> {
    return this.http.post<Evidence>(`${this.base}/evidence/upload`, form);
  }
  evidenceVersions(evidenceId: string): Observable<EvidenceVersion[]> {
    return this.http.get<EvidenceVersion[]>(`${this.base}/evidence/${evidenceId}/versions`);
  }
  addEvidenceVersion(evidenceId: string, form: FormData): Observable<Evidence> {
    return this.http.post<Evidence>(`${this.base}/evidence/${evidenceId}/versions`, form);
  }
  mappings(evidenceId: string): Observable<Mapping[]> {
    return this.http.get<Mapping[]>(`${this.base}/evidence/${evidenceId}/mappings`);
  }
  createMapping(evidenceId: string, body: {
    controlId: string; mappingType: string; classification?: string; confidence?: number; reason?: string;
  }): Observable<Mapping> {
    return this.http.post<Mapping>(`${this.base}/evidence/${evidenceId}/map`, body);
  }
  confirmMapping(evidenceId: string, mappingId: string): Observable<Mapping> {
    return this.http.post<Mapping>(`${this.base}/evidence/${evidenceId}/mappings/${mappingId}/confirm`, {});
  }
  rejectMapping(evidenceId: string, mappingId: string): Observable<unknown> {
    return this.http.delete(`${this.base}/evidence/${evidenceId}/mappings/${mappingId}`);
  }
  reviewEvidence(evidenceId: string, body: { decision: 'APPROVED' | 'REJECTED'; comments?: string }): Observable<unknown> {
    return this.http.post(`${this.base}/evidence/${evidenceId}/review`, body);
  }
  analyzeEvidence(evidenceId: string, body: { controlId: string }): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/evidence/${evidenceId}/analyze`, body);
  }

  // Policies
  policies(): Observable<Policy[]> { return this.http.get<Policy[]>(`${this.base}/policies`); }
  policy(id: string): Observable<PolicyDetail> { return this.http.get<PolicyDetail>(`${this.base}/policies/${id}`); }
  createPolicy(form: FormData): Observable<Policy> {
    return this.http.post<Policy>(`${this.base}/policies`, form);
  }
  addPolicyVersion(id: string, form: FormData): Observable<Policy> {
    return this.http.post<Policy>(`${this.base}/policies/${id}/versions`, form);
  }
  acknowledgePolicy(id: string): Observable<Policy> {
    return this.http.post<Policy>(`${this.base}/policies/${id}/acknowledge`, {});
  }
  updatePolicy(id: string, body: { ownerUserId?: string | null; category: string; description?: string; nextReviewDate?: string | null }): Observable<Policy> {
    return this.http.patch<Policy>(`${this.base}/policies/${id}`, body);
  }
  archivePolicy(id: string): Observable<Policy> {
    return this.http.post<Policy>(`${this.base}/policies/${id}/archive`, {});
  }
  remindPolicy(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/policies/${id}/remind`, {});
  }
  policyCoverage(): Observable<PolicyCoverage> {
    return this.http.get<PolicyCoverage>(`${this.base}/policies/coverage`);
  }
  policyCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/policies/categories`);
  }
  confirmAllPolicyMappings(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/policies/${id}/mappings/confirm-all`, {});
  }

  // Login-free policy acknowledgment portal (magic-link token, no auth header needed)
  portalPolicies(token: string, page: number, size: number): Observable<PolicyPortalPage> {
    return this.http.get<PolicyPortalPage>(`${this.base}/policy-portal/policies`, { params: { token, page, size } });
  }
  portalPolicy(token: string, id: string): Observable<PolicyPortalDetail> {
    return this.http.get<PolicyPortalDetail>(`${this.base}/policy-portal/policies/${id}`, { params: { token } });
  }
  portalDocumentUrl(token: string, id: string): string {
    return `${this.base}/policy-portal/policies/${id}/document?token=${encodeURIComponent(token)}`;
  }
  portalAcknowledge(token: string, id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/policy-portal/policies/${id}/acknowledge`, {}, { params: { token } });
  }

  // Real-login "My Policies" (normal JWT session, restricted for ACKNOWLEDGER-role accounts server-side)
  myPolicies(page: number, size: number): Observable<PolicyPortalPage> {
    return this.http.get<PolicyPortalPage>(`${this.base}/my-policies`, { params: { page, size } });
  }
  myPolicy(id: string): Observable<PolicyPortalDetail> {
    return this.http.get<PolicyPortalDetail>(`${this.base}/my-policies/${id}`);
  }
  myPolicyDocumentUrl(id: string): string {
    return `${this.base}/my-policies/${id}/document`;
  }
  myPolicyDocumentBlob(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/my-policies/${id}/document`, { responseType: 'blob' });
  }
  acknowledgeMyPolicy(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/my-policies/${id}/acknowledge`, {});
  }

  // Integrations
  integrations(): Observable<Integration[]> { return this.http.get<Integration[]>(`${this.base}/integrations`); }
  connectGitHub(body: { token: string; displayName?: string }): Observable<Integration> {
    return this.http.post<Integration>(`${this.base}/integrations/github`, body);
  }
  testIntegration(id: string): Observable<{ ok: boolean; provider: string; message: string; testedAt: string }> {
    return this.http.post<{ ok: boolean; provider: string; message: string; testedAt: string }>(
      `${this.base}/integrations/${id}/test`, {});
  }
  collectIntegration(id: string): Observable<{ collectionRunId: string }> {
    return this.http.post<{ collectionRunId: string }>(`${this.base}/integrations/${id}/collect`, {});
  }
  disconnectIntegration(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/integrations/${id}`);
  }
  updateIntegrationSchedule(id: string, schedule: 'MANUAL' | 'DAILY' | 'WEEKLY'): Observable<Integration> {
    return this.http.patch<Integration>(`${this.base}/integrations/${id}/schedule`, { schedule });
  }

  // Organization settings
  organization(): Observable<Organization> {
    return this.http.get<Organization>(`${this.base}/organizations/current`);
  }
  updateOrganization(body: { name: string }): Observable<Organization> {
    return this.http.patch<Organization>(`${this.base}/organizations/current`, body);
  }
  completeOnboarding(): Observable<Organization> {
    return this.http.post<Organization>(`${this.base}/organizations/current/onboarding/complete`, {});
  }
  updateComplianceProgram(body: {
    tscScopeExtra: string[]; reportType: string;
    observationPeriodStart: string | null; observationPeriodEnd: string | null; targetReportDate: string | null;
    servicesProvided: string | null; systemBoundaries: string | null;
    componentsDescription: string | null; subserviceOrganizations: string | null;
    complementaryUserEntityControls: string | null; significantChangesDuringPeriod: string | null;
  }): Observable<Organization> {
    return this.http.patch<Organization>(`${this.base}/organizations/current/compliance-program`, body);
  }
  generateSystemDescription(): Observable<void> {
    return this.http.post<void>(`${this.base}/organizations/current/system-description/generate`, {});
  }
  readinessReportBlob(): Observable<Blob> {
    return this.http.get(`${this.base}/readiness-report/download`, { responseType: 'blob' });
  }
  assignControlOwner(controlId: string, userId: string | null): Observable<Control> {
    return this.http.put<Control>(`${this.base}/controls/${controlId}/owner`, { userId });
  }
  members(): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.base}/organizations/current/members`);
  }

  // Risk register (SOC 2 CC3-series risk assessment)
  risks(): Observable<Risk[]> {
    return this.http.get<Risk[]>(`${this.base}/risks`);
  }
  risk(id: string): Observable<Risk> {
    return this.http.get<Risk>(`${this.base}/risks/${id}`);
  }
  createRisk(body: CreateRiskRequest): Observable<Risk> {
    return this.http.post<Risk>(`${this.base}/risks`, body);
  }
  updateRisk(id: string, body: UpdateRiskRequest): Observable<Risk> {
    return this.http.put<Risk>(`${this.base}/risks/${id}`, body);
  }
  updateRiskStatus(id: string, status: RiskStatus): Observable<Risk> {
    return this.http.put<Risk>(`${this.base}/risks/${id}/status`, { status });
  }
  assignRiskOwner(id: string, userId: string | null): Observable<Risk> {
    return this.http.put<Risk>(`${this.base}/risks/${id}/owner`, { userId });
  }
  deleteRisk(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/risks/${id}`);
  }

  // Control exceptions/deviations (SOC 2 Type II — proof a control failed and was remediated)
  controlExceptions(controlId: string): Observable<ControlException[]> {
    return this.http.get<ControlException[]>(`${this.base}/controls/${controlId}/exceptions`);
  }
  logControlException(controlId: string, body: CreateControlExceptionRequest): Observable<ControlException> {
    return this.http.post<ControlException>(`${this.base}/controls/${controlId}/exceptions`, body);
  }
  remediateControlException(controlId: string, exceptionId: string, remediatedDate: string): Observable<ControlException> {
    return this.http.put<ControlException>(`${this.base}/controls/${controlId}/exceptions/${exceptionId}/remediate`, { remediatedDate });
  }
  deleteControlException(controlId: string, exceptionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/controls/${controlId}/exceptions/${exceptionId}`);
  }
  addMember(body: { email: string; name: string; role: string }): Observable<Member> {
    return this.http.post<Member>(`${this.base}/organizations/current/members`, body);
  }
  updateMemberRole(memberId: string, role: string): Observable<Member> {
    return this.http.patch<Member>(`${this.base}/organizations/current/members/${memberId}`, { role });
  }
  subscription(): Observable<SubscriptionResponse> {
    return this.http.get<SubscriptionResponse>(`${this.base}/organizations/current/subscription`);
  }
  subscriptionRequests(): Observable<SubscriptionRequestResponse[]> {
    return this.http.get<SubscriptionRequestResponse[]>(`${this.base}/organizations/current/subscription/requests`);
  }
  createSubscriptionRequest(body: CreateSubscriptionRequestBody): Observable<SubscriptionRequestResponse> {
    return this.http.post<SubscriptionRequestResponse>(`${this.base}/organizations/current/subscription/requests`, body);
  }
  revokeSubscriptionRequest(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/organizations/current/subscription/requests/${id}/revoke`, {});
  }

  // Collection activity
  collectionRuns(integrationId?: string): Observable<CollectionRun[]> {
    const url = integrationId
      ? `${this.base}/collections?integrationId=${integrationId}`
      : `${this.base}/collections`;
    return this.http.get<CollectionRun[]>(url);
  }
  collectionRun(id: string): Observable<CollectionRunDetail> {
    return this.http.get<CollectionRunDetail>(`${this.base}/collections/${id}`);
  }

  // Audit log
  auditEvents(): Observable<AuditEvent[]> {
    return this.http.get<AuditEvent[]>(`${this.base}/audit-events`);
  }

  // Dashboard
  summary(): Observable<DashboardSummary> { return this.http.get<DashboardSummary>(`${this.base}/dashboard/summary`); }
  gaps(): Observable<ControlGap[]> { return this.http.get<ControlGap[]>(`${this.base}/dashboard/gaps`); }
  recentEvidence(): Observable<Evidence[]> { return this.http.get<Evidence[]>(`${this.base}/dashboard/recent-evidence`); }
  coverageTrend(days = 30): Observable<CoverageTrendPoint[]> {
    return this.http.get<CoverageTrendPoint[]>(`${this.base}/dashboard/coverage-trend?days=${days}`);
  }

  // Export
  startExport(): Observable<ExportJob> {
    return this.http.post<ExportJob>(`${this.base}/exports/audit-package`, {});
  }
  exportStatus(id: string): Observable<ExportJob> {
    return this.http.get<ExportJob>(`${this.base}/exports/${id}`);
  }
  exportDownloadUrl(id: string): string {
    return `${this.base}/exports/${id}/download`;
  }

  // Platform admin console
  adminOrganizations(): Observable<AdminOrganizationSummary[]> {
    return this.http.get<AdminOrganizationSummary[]>(`${this.base}/admin/organizations`);
  }
  adminOrganization(id: string): Observable<AdminOrganizationDetail> {
    return this.http.get<AdminOrganizationDetail>(`${this.base}/admin/organizations/${id}`);
  }
  updateAdminSubscription(id: string, body: UpdateSubscriptionRequest): Observable<AdminOrganizationSummary> {
    return this.http.patch<AdminOrganizationSummary>(`${this.base}/admin/organizations/${id}/subscription`, body);
  }
  adminSubscriptionRequests(status: 'PENDING' | 'ALL' = 'PENDING'): Observable<AdminSubscriptionRequestResponse[]> {
    return this.http.get<AdminSubscriptionRequestResponse[]>(`${this.base}/admin/subscription-requests?status=${status}`);
  }
  approveSubscriptionRequest(id: string): Observable<AdminSubscriptionRequestResponse> {
    return this.http.post<AdminSubscriptionRequestResponse>(`${this.base}/admin/subscription-requests/${id}/approve`, {});
  }
  rejectSubscriptionRequest(id: string, reviewNote?: string): Observable<AdminSubscriptionRequestResponse> {
    return this.http.post<AdminSubscriptionRequestResponse>(`${this.base}/admin/subscription-requests/${id}/reject`, { reviewNote });
  }
}
