import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Control, ControlGap, DashboardSummary, Evidence, ExportJob, Framework,
  Integration, Mapping, Me, TokenResponse
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

  // Evidence
  evidence(): Observable<Evidence[]> { return this.http.get<Evidence[]>(`${this.base}/evidence`); }
  evidenceById(id: string): Observable<Evidence> { return this.http.get<Evidence>(`${this.base}/evidence/${id}`); }
  uploadEvidence(form: FormData): Observable<Evidence> {
    return this.http.post<Evidence>(`${this.base}/evidence/upload`, form);
  }
  mappings(evidenceId: string): Observable<Mapping[]> {
    return this.http.get<Mapping[]>(`${this.base}/evidence/${evidenceId}/mappings`);
  }
  createMapping(evidenceId: string, body: {
    controlId: string; mappingType: string; classification?: string; confidence?: number; reason?: string;
  }): Observable<Mapping> {
    return this.http.post<Mapping>(`${this.base}/evidence/${evidenceId}/map`, body);
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

  // Dashboard
  summary(): Observable<DashboardSummary> { return this.http.get<DashboardSummary>(`${this.base}/dashboard/summary`); }
  gaps(): Observable<ControlGap[]> { return this.http.get<ControlGap[]>(`${this.base}/dashboard/gaps`); }
  recentEvidence(): Observable<Evidence[]> { return this.http.get<Evidence[]>(`${this.base}/dashboard/recent-evidence`); }

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
