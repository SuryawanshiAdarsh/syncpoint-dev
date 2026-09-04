import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ApiService } from '@core/api/api.service';
import { AdminOrganizationDetail, SubscriptionPlan, SubscriptionStatus } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import {
  UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiToastComponent, UiButtonComponent, UiBadgeComponent,
} from '@ui';

function toDateInputValue(iso?: string): string {
  return iso ? iso.slice(0, 10) : '';
}
function fromDateInputValue(value: string): string | null {
  return value ? `${value}T00:00:00Z` : null;
}

@Component({
  standalone: true,
  selector: 'app-admin-organization-detail',
  imports: [
    CommonModule, RouterLink, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiToastComponent, UiButtonComponent, UiBadgeComponent,
  ],
  styles: [`
    .back-link { display: inline-block; margin-bottom: var(--space-4); color: var(--color-text-muted); font-size: var(--text-sm); text-decoration: none; }
    .back-link:hover { color: var(--color-text); }
    .usage-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
    @media (max-width: 900px) { .usage-row { grid-template-columns: 1fr 1fr; } }
    .usage-item .value { font-size: var(--text-xl); font-weight: var(--weight-semibold); }
    .usage-item .label { color: var(--color-text-muted); font-size: var(--text-sm); margin-top: 2px; }
    .form-row { display: flex; gap: var(--space-3); align-items: end; flex-wrap: wrap; }
    .form-row + .form-row { margin-top: var(--space-4); }
    .member-row { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-divider); }
    .member-row:last-child { border-bottom: none; }
    .member-row .who { flex: 1; min-width: 0; }
    .member-row .name { font-weight: var(--weight-medium); }
    .member-row .email { color: var(--color-text-muted); font-size: var(--text-sm); }
  `],
  template: `
    <div class="page">
      <a class="back-link" routerLink="/admin">{{ c.admin.backToList }}</a>

      <ng-container *ngIf="detail() as d">
        <ui-page-header [eyebrow]="c.admin.detailEyebrow" [title]="d.summary.name" [subtitle]="d.summary.slug"></ui-page-header>

        <ui-card [title]="c.admin.usageTitle" style="display:block;">
          <div class="usage-row">
            <div class="usage-item"><div class="value">{{ d.summary.userCount }}</div><div class="label">{{ c.admin.tableUsers }}</div></div>
            <div class="usage-item"><div class="value">{{ d.summary.evidenceCount }}</div><div class="label">{{ c.admin.tableEvidence }}</div></div>
            <div class="usage-item"><div class="value">{{ d.summary.connectedIntegrationCount }}/{{ d.summary.integrationCount }}</div><div class="label">{{ c.admin.tableIntegrations }}</div></div>
            <div class="usage-item"><div class="value">{{ d.summary.coveragePercent }}%</div><div class="label">{{ c.admin.tableCoverage }}</div></div>
          </div>
        </ui-card>

        <ui-card [title]="c.admin.subscriptionTitle" [caption]="c.admin.subscriptionCaption" style="display:block;margin-top:var(--space-4);">
          <div class="form-row">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.admin.planLabel }}</mat-label>
              <mat-select [(ngModel)]="plan">
                <mat-option value="TRIAL">{{ c.admin.PLAN_TRIAL }}</mat-option>
                <mat-option value="STARTER">{{ c.admin.PLAN_STARTER }}</mat-option>
                <mat-option value="PRO">{{ c.admin.PLAN_PRO }}</mat-option>
                <mat-option value="ENTERPRISE">{{ c.admin.PLAN_ENTERPRISE }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.admin.statusLabel }}</mat-label>
              <mat-select [(ngModel)]="status">
                <mat-option value="TRIALING">{{ c.admin.SUB_TRIALING }}</mat-option>
                <mat-option value="ACTIVE">{{ c.admin.SUB_ACTIVE }}</mat-option>
                <mat-option value="PAST_DUE">{{ c.admin.SUB_PAST_DUE }}</mat-option>
                <mat-option value="CANCELED">{{ c.admin.SUB_CANCELED }}</mat-option>
                <mat-option value="SUSPENDED">{{ c.admin.SUB_SUSPENDED }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:140px;" subscriptSizing="dynamic">
              <mat-label>{{ c.admin.seatLimitLabel }}</mat-label>
              <input matInput type="number" min="1" [(ngModel)]="seatLimit">
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.admin.trialEndsAtLabel }}</mat-label>
              <input matInput type="date" [(ngModel)]="trialEndsAt">
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.admin.currentPeriodEndLabel }}</mat-label>
              <input matInput type="date" [(ngModel)]="currentPeriodEnd">
            </mat-form-field>
            <ui-button variant="primary" [loading]="saving()" [loadingText]="c.admin.savingButton" (click)="save()">
              {{ c.admin.saveButton }}
            </ui-button>
          </div>
        </ui-card>

        <ui-card [title]="c.admin.membersTitle" style="display:block;margin-top:var(--space-4);">
          <div *ngFor="let m of d.members" class="member-row">
            <div class="who">
              <div class="name">{{ m.name }}</div>
              <div class="email">{{ m.email }}</div>
            </div>
            <ui-badge variant="info">{{ m.role }}</ui-badge>
          </div>
        </ui-card>
      </ng-container>

      <ui-empty-state *ngIf="!detail() && loaded()" icon="error_outline" [title]="c.admin.loadError"></ui-empty-state>

      <ui-toast *ngIf="msg()" variant="success">{{ msg() }}</ui-toast>
      <ui-toast *ngIf="err()" variant="error">{{ err() }}</ui-toast>
    </div>
  `,
})
export class AdminOrganizationDetailComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private orgId = '';

  detail = signal<AdminOrganizationDetail | null>(null);
  loaded = signal(false);
  saving = signal(false);
  msg = signal('');
  err = signal('');

  plan: SubscriptionPlan = 'TRIAL';
  status: SubscriptionStatus = 'TRIALING';
  seatLimit: number | null = null;
  trialEndsAt = '';
  currentPeriodEnd = '';

  ngOnInit(): void {
    this.orgId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  private load(): void {
    this.api.adminOrganization(this.orgId).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loaded.set(true);
        this.plan = d.summary.plan;
        this.status = d.summary.status;
        this.seatLimit = d.summary.seatLimit ?? null;
        this.trialEndsAt = toDateInputValue(d.summary.trialEndsAt);
        this.currentPeriodEnd = toDateInputValue(d.summary.currentPeriodEnd);
      },
      error: () => this.loaded.set(true),
    });
  }

  save(): void {
    this.saving.set(true);
    this.err.set('');
    this.api.updateAdminSubscription(this.orgId, {
      plan: this.plan,
      status: this.status,
      seatLimit: this.seatLimit,
      trialEndsAt: fromDateInputValue(this.trialEndsAt),
      currentPeriodEnd: fromDateInputValue(this.currentPeriodEnd),
    }).subscribe({
      next: (summary) => {
        this.saving.set(false);
        this.msg.set(this.c.admin.subscriptionUpdatedToast);
        const d = this.detail();
        if (d) this.detail.set({ ...d, summary });
        setTimeout(() => this.msg.set(''), 2500);
      },
      error: () => {
        this.saving.set(false);
        this.err.set(this.c.admin.actionError);
        setTimeout(() => this.err.set(''), 3000);
      },
    });
  }
}
