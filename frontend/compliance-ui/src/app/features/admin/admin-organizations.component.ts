import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ApiService } from '@core/api/api.service';
import { AdminOrganizationSummary, AdminSubscriptionRequestResponse, SubscriptionStatus } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import { UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiBadgeComponent, UiBadgeVariant, UiButtonComponent, UiToastComponent } from '@ui';
import {
  subscriptionPlanLabel, subscriptionStatusLabel, subscriptionStatusBadgeVariant,
  subscriptionRequestStatusBadgeVariant, subscriptionRequestStatusLabel,
} from '@constants';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const REQUESTS_PAGE_SIZE = 5;
const ORGS_PAGE_SIZE = 10;

@Component({
  standalone: true,
  selector: 'app-admin-organizations',
  imports: [
    CommonModule, RouterLink, FormsModule, MatFormFieldModule, MatInputModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiBadgeComponent, UiButtonComponent, UiToastComponent,
  ],
  styles: [`
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    @media (max-width: 900px) { .kpi-row { grid-template-columns: 1fr 1fr; } }
    .kpi {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-5);
    }
    .kpi .value { font-size: var(--text-2xl); font-weight: var(--weight-semibold); }
    .kpi .label { color: var(--color-text-muted); font-size: var(--text-sm); margin-top: 2px; }
    .org-name { font-weight: var(--weight-medium); }
    .org-slug { color: var(--color-text-muted); font-size: var(--text-sm); }
    tr.clickable { cursor: pointer; }
    tr.clickable:hover { background: var(--color-surface-muted); }

    .request-row { padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--color-divider); }
    .request-row:last-child { border-bottom: none; }
    .request-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
    .requested-by { color: var(--color-text-muted); font-size: var(--text-sm); }
    .change-line { margin-top: var(--space-2); font-size: var(--text-sm); }
    .note-line { margin-top: var(--space-1); color: var(--color-text-secondary); font-size: var(--text-sm); font-style: italic; }
    .actions { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
    .reject-form { display: flex; gap: var(--space-3); align-items: end; margin-top: var(--space-3); }
    .pager {
      display: flex; align-items: center; justify-content: center; gap: 14px;
      padding: 14px var(--space-6);
      border-top: 1px solid var(--color-divider);
    }
  `],
  template: `
    <div class="page">
      <ui-page-header [eyebrow]="c.admin.eyebrow" [title]="c.admin.title" [subtitle]="c.admin.subtitle"></ui-page-header>

      <div class="kpi-row">
        <div class="kpi"><div class="value">{{ orgs().length }}</div><div class="label">{{ c.admin.kpiTotalCustomers }}</div></div>
        <div class="kpi"><div class="value">{{ activeTrials() }}</div><div class="label">{{ c.admin.kpiActiveTrials }}</div></div>
        <div class="kpi"><div class="value">{{ expiringSoon() }}</div><div class="label">{{ c.admin.kpiExpiringSoon }}</div></div>
        <div class="kpi"><div class="value">{{ pastDueOrSuspended() }}</div><div class="label">{{ c.admin.kpiPastDue }}</div></div>
      </div>

      <ui-card [title]="c.admin.requestsTitle" [caption]="c.admin.requestsSubtitle" padding="flush" style="display:block;margin-bottom:var(--space-4);">
        <ng-container *ngIf="requests().length; else emptyRequests">
          <div *ngFor="let r of pagedRequests()" class="request-row">
            <div class="request-head">
              <div>
                <div class="org-name">{{ r.organizationName }}</div>
                <div class="org-slug">{{ r.organizationSlug }}</div>
                <div class="requested-by">{{ c.admin.requestsTableRequestedBy }}: {{ r.requestedByName }} ({{ r.requestedByEmail }})</div>
              </div>
              <ui-badge [variant]="requestStatusVariant(r.status)">{{ requestStatusLabel(r.status) }}</ui-badge>
            </div>
            <div class="change-line">
              {{ c.admin.requestsTableCurrent }}: {{ planLabel(r.currentPlan ?? '') }}, {{ r.currentSeatLimit ?? c.settings.billingSeatsUnlimited }} seats
              &rarr; {{ c.admin.requestsTableRequested }}: {{ planLabel(r.requestedPlan) }}, {{ r.requestedSeatLimit }} seats
            </div>
            <div class="note-line" *ngIf="r.note">"{{ r.note }}"</div>

            <div class="actions" *ngIf="r.status === 'PENDING'">
              <ui-button variant="primary" [loading]="approvingId() === r.id" [loadingText]="c.admin.approvingButton"
                         (click)="approve(r)">
                {{ c.admin.approveButton }}
              </ui-button>
              <ui-button variant="ghost" (click)="toggleReject(r.id)">
                {{ c.admin.rejectButton }}
              </ui-button>
            </div>

            <form class="reject-form" *ngIf="rejectingId() === r.id" (ngSubmit)="reject(r)">
              <mat-form-field appearance="outline" style="flex:1;" subscriptSizing="dynamic">
                <mat-label>{{ c.admin.rejectReasonLabel }}</mat-label>
                <input matInput name="reviewNote" [(ngModel)]="reviewNote">
              </mat-form-field>
              <ui-button variant="danger" type="submit" [loading]="submittingReject()" [loadingText]="c.admin.rejectingButton">
                {{ c.admin.rejectConfirmButton }}
              </ui-button>
              <ui-button variant="ghost" type="button" (click)="cancelReject()">{{ c.admin.rejectCancelButton }}</ui-button>
            </form>
          </div>

          <div class="pager" *ngIf="totalRequestPages() > 1">
            <button class="btn ghost sm" (click)="prevRequestPage()" [disabled]="requestPage() === 0">{{ c.evidence.pagePrev }}</button>
            <span class="muted small">{{ c.admin.requestsPageInfo }} {{ requestPage() + 1 }} {{ c.admin.requestsOf }} {{ totalRequestPages() }}</span>
            <button class="btn ghost sm" (click)="nextRequestPage()" [disabled]="requestPage() >= totalRequestPages() - 1">{{ c.evidence.pageNext }}</button>
          </div>
        </ng-container>
        <ng-template #emptyRequests>
          <ui-empty-state icon="fact_check" [title]="c.admin.requestsEmptyTitle" [description]="c.admin.requestsEmptyMessage"></ui-empty-state>
        </ng-template>
      </ui-card>

      <ui-card [title]="c.admin.listTitle" padding="flush">
        <table class="data-table" *ngIf="orgs().length; else empty">
          <thead>
            <tr>
              <th>{{ c.admin.tableOrganization }}</th>
              <th>{{ c.admin.tablePlan }}</th>
              <th>{{ c.admin.tableStatus }}</th>
              <th style="text-align:right;">{{ c.admin.tableUsers }}</th>
              <th style="text-align:right;">{{ c.admin.tableEvidence }}</th>
              <th style="text-align:right;">{{ c.admin.tableIntegrations }}</th>
              <th style="text-align:right;">{{ c.admin.tableCoverage }}</th>
              <th>{{ c.admin.tableExpiry }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of pagedOrgs()" class="clickable" [routerLink]="['/admin', o.organizationId]">
              <td>
                <div class="org-name">{{ o.name }}</div>
                <div class="org-slug">{{ o.slug }}</div>
              </td>
              <td>{{ planLabel(o.plan) }}</td>
              <td><ui-badge [variant]="statusVariant(o.status)">{{ statusLabel(o.status) }}</ui-badge></td>
              <td style="text-align:right;">{{ o.userCount }}</td>
              <td style="text-align:right;">{{ o.evidenceCount }}</td>
              <td style="text-align:right;">{{ o.connectedIntegrationCount }}/{{ o.integrationCount }}</td>
              <td style="text-align:right;">{{ o.coveragePercent }}%</td>
              <td>{{ expiryFor(o) | date:'MMM d, y' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="pager" *ngIf="totalOrgPages() > 1">
          <button class="btn ghost sm" (click)="prevOrgPage()" [disabled]="orgPage() === 0">{{ c.evidence.pagePrev }}</button>
          <span class="muted small">{{ c.admin.requestsPageInfo }} {{ orgPage() + 1 }} {{ c.admin.requestsOf }} {{ totalOrgPages() }}</span>
          <button class="btn ghost sm" (click)="nextOrgPage()" [disabled]="orgPage() >= totalOrgPages() - 1">{{ c.evidence.pageNext }}</button>
        </div>
        <ng-template #empty>
          <ui-empty-state icon="business" [title]="c.admin.emptyTitle" [description]="c.admin.emptyMessage"></ui-empty-state>
        </ng-template>
      </ui-card>

      <ui-toast *ngIf="msg()" variant="success">{{ msg() }}</ui-toast>
      <ui-toast *ngIf="err()" variant="error">{{ err() }}</ui-toast>
    </div>
  `,
})
export class AdminOrganizationsComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  orgs = signal<AdminOrganizationSummary[]>([]);
  orgPage = signal(0);
  requests = signal<AdminSubscriptionRequestResponse[]>([]);
  requestPage = signal(0);
  approvingId = signal<string | null>(null);
  rejectingId = signal<string | null>(null);
  submittingReject = signal(false);
  reviewNote = '';

  msg = signal('');
  err = signal('');

  activeTrials = computed(() => this.orgs().filter(o => o.status === 'TRIALING').length);
  pastDueOrSuspended = computed(() => this.orgs().filter(o => o.status === 'PAST_DUE' || o.status === 'SUSPENDED').length);
  expiringSoon = computed(() => {
    const now = Date.now();
    return this.orgs().filter(o => {
      const expiry = this.expiryFor(o);
      if (!expiry) return false;
      const t = new Date(expiry).getTime();
      return t >= now && t - now <= SEVEN_DAYS_MS;
    }).length;
  });

  totalRequestPages = computed(() => Math.max(1, Math.ceil(this.requests().length / REQUESTS_PAGE_SIZE)));
  pagedRequests = computed(() => {
    const start = this.requestPage() * REQUESTS_PAGE_SIZE;
    return this.requests().slice(start, start + REQUESTS_PAGE_SIZE);
  });

  totalOrgPages = computed(() => Math.max(1, Math.ceil(this.orgs().length / ORGS_PAGE_SIZE)));
  pagedOrgs = computed(() => {
    const start = this.orgPage() * ORGS_PAGE_SIZE;
    return this.orgs().slice(start, start + ORGS_PAGE_SIZE);
  });

  ngOnInit(): void {
    this.api.adminOrganizations().subscribe({ next: (rows) => this.orgs.set(rows) });
    this.loadRequests();
  }

  expiryFor(o: AdminOrganizationSummary): string | undefined {
    return o.status === 'TRIALING' ? o.trialEndsAt : o.currentPeriodEnd;
  }

  planLabel(plan: string): string {
    return subscriptionPlanLabel(plan);
  }
  statusLabel(status: SubscriptionStatus): string {
    return subscriptionStatusLabel(status);
  }
  statusVariant(status: SubscriptionStatus): UiBadgeVariant {
    return subscriptionStatusBadgeVariant(status);
  }
  requestStatusLabel(status: string): string { return subscriptionRequestStatusLabel(status); }
  requestStatusVariant(status: string): UiBadgeVariant { return subscriptionRequestStatusBadgeVariant(status); }

  prevRequestPage(): void { this.requestPage.update(p => Math.max(0, p - 1)); }
  nextRequestPage(): void { this.requestPage.update(p => Math.min(this.totalRequestPages() - 1, p + 1)); }

  prevOrgPage(): void { this.orgPage.update(p => Math.max(0, p - 1)); }
  nextOrgPage(): void { this.orgPage.update(p => Math.min(this.totalOrgPages() - 1, p + 1)); }

  approve(r: AdminSubscriptionRequestResponse): void {
    this.approvingId.set(r.id);
    this.api.approveSubscriptionRequest(r.id).subscribe({
      next: () => { this.msg.set(this.c.admin.approvedToast); this.err.set(''); this.loadRequests(); },
      error: (e) => this.err.set(e?.error?.message ?? this.c.admin.actionError),
      complete: () => this.approvingId.set(null),
    });
  }

  toggleReject(id: string): void {
    this.rejectingId.set(this.rejectingId() === id ? null : id);
    this.reviewNote = '';
  }
  cancelReject(): void {
    this.rejectingId.set(null);
    this.reviewNote = '';
  }

  reject(r: AdminSubscriptionRequestResponse): void {
    this.submittingReject.set(true);
    this.api.rejectSubscriptionRequest(r.id, this.reviewNote.trim() || undefined).subscribe({
      next: () => {
        this.msg.set(this.c.admin.rejectedToast);
        this.err.set('');
        this.rejectingId.set(null);
        this.loadRequests();
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.admin.actionError),
      complete: () => this.submittingReject.set(false),
    });
  }

  private loadRequests(): void {
    this.api.adminSubscriptionRequests('PENDING').subscribe(list => {
      this.requests.set(list);
      if (this.requestPage() >= this.totalRequestPages()) this.requestPage.set(0);
    });
  }
}
