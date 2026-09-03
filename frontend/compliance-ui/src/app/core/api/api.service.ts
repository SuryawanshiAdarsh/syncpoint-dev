import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Control, ControlGap, ControlMapping, AiAnalysisSummary, AuditEvent, CollectionRun, CollectionRunDetail,
  CoverageTrendPoint, DashboardSummary, Evidence, EvidenceVersion, ExportJob, Framework, Integration, Mapping, Me,
  Member, Organization, TokenResponse
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
  members(): Observable<Member[]> {
    return this.http.get<Member[]>(`${this.base}/organizations/current/members`);
  }
  addMember(body: { email: string; name: string; password: string; role: string }): Observable<Member> {
    return this.http.post<Member>(`${this.base}/organizations/current/members`, body);
  }
  updateMemberRole(memberId: string, role: string): Observable<Member> {
    return this.http.patch<Member>(`${this.base}/organizations/current/members/${memberId}`, { role });
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
}
