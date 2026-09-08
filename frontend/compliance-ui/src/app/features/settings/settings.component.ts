import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '../../core/api/api.service';
import { Me, Organization, Member, Integration, Role, SubscriptionResponse, SubscriptionRequestResponse, SubscriptionPlan } from '../../core/api/api.types';
import { CAPTIONS } from '@captions';
import { subscriptionPlanLabel, subscriptionStatusLabel, subscriptionStatusBadgeVariant } from '@constants';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiToastComponent,
  UiButtonComponent,
  UiBadgeComponent,
} from '@ui';

type ScheduleValue = 'MANUAL' | 'DAILY' | 'WEEKLY';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiToastComponent,
    UiButtonComponent, UiBadgeComponent,
  ],
  styles: [`
    .row { display: flex; gap: var(--space-3); align-items: end; flex-wrap: wrap; }
    .row + .row { margin-top: var(--space-4); }
    .member-row, .integration-row {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--color-divider);
    }
    .member-row:last-child, .integration-row:last-child { border-bottom: none; }
    .member-row .who, .integration-row .who { flex: 1; min-width: 0; }
    .member-row .name, .integration-row .name { font-weight: var(--weight-medium); }
    .member-row .email, .integration-row .meta { color: var(--color-text-muted); font-size: var(--text-sm); }
    .invite-form {
      display: grid;
      grid-template-columns: 1.2fr 1.4fr 1fr 1fr auto;
      gap: var(--space-3);
      align-items: end;
      padding-bottom: var(--space-5);
      margin-bottom: var(--space-5);
      border-bottom: 1px solid var(--color-divider);
    }
    @media (max-width: 900px) { .invite-form { grid-template-columns: 1fr; } }
    .billing-row { display: flex; gap: var(--space-6); align-items: center; flex-wrap: wrap; }
    .billing-item .label { color: var(--color-text-muted); font-size: var(--text-sm); }
    .billing-item .value { font-weight: var(--weight-medium); margin-top: 2px; }
    .canceled-note { color: var(--color-danger-text); font-size: var(--text-sm); margin-top: var(--space-4); }
    .request-banner {
      display: flex; align-items: flex-start; gap: var(--space-3);
      margin-top: var(--space-5);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      background: var(--color-info-soft); color: var(--color-info-text); border: 1px solid var(--color-info-border);
      font-size: var(--text-sm);
    }
    .request-banner.rejected { background: var(--color-danger-soft); color: var(--color-danger-text); border-color: var(--color-danger-border); }
    .request-banner.approved { background: var(--color-success-soft); color: var(--color-success-text); border-color: var(--color-success-border); }
    .request-banner mat-icon { font-size: 18px; height: 18px; width: 18px; flex-shrink: 0; margin-top: 1px; }
    .request-banner-title { font-weight: var(--weight-medium); }
    .request-form {
      display: flex; gap: var(--space-3); align-items: end; flex-wrap: wrap;
      margin-top: var(--space-5);
      padding-top: var(--space-5);
      border-top: 1px solid var(--color-divider);
    }
    .program-label {
      font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: var(--space-3);
    }
    .scope-row { display: flex; gap: var(--space-3); flex-wrap: wrap; }
    .scope-chip {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      font-size: var(--text-sm); cursor: pointer;
    }
    .scope-chip.disabled { color: var(--color-text-muted); cursor: default; }
    .desc-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);
    }
    @media (max-width: 900px) { .desc-grid { grid-template-columns: 1fr; } }
  `],
  template: `
    <div class="page">
      <ui-page-header [eyebrow]="c.settings.eyebrow" [title]="c.settings.title" [subtitle]="c.settings.subtitle"></ui-page-header>

      <ng-container *ngIf="canManage(); else restricted">
        <ui-card [title]="c.settings.generalTitle" [caption]="c.settings.generalCaption">
          <div class="row">
            <mat-form-field appearance="outline" style="flex:1;min-width:260px;" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.orgNameLabel }}</mat-label>
              <input matInput [(ngModel)]="orgName" [disabled]="!isOwner()">
            </mat-form-field>
            <ui-button variant="primary" [disabled]="!isOwner() || !orgName.trim()" [loading]="savingOrg()"
                       [loadingText]="c.settings.savingButton" (click)="saveOrg()">
              {{ c.settings.saveButton }}
            </ui-button>
          </div>
        </ui-card>

        <ui-card [title]="c.settings.billingTitle" [caption]="c.settings.billingCaption" style="display:block;margin-top:var(--space-4);" *ngIf="subscription() as sub">
          <div class="billing-row">
            <div class="billing-item">
              <div class="label">{{ c.settings.billingPlanLabel }}</div>
              <div class="value">{{ planLabel(sub.plan) }}</div>
            </div>
            <div class="billing-item">
              <div class="label">{{ c.settings.billingStatusLabel }}</div>
              <ui-badge [variant]="statusVariant(sub.status)">{{ statusLabel(sub.status) }}</ui-badge>
            </div>
            <div class="billing-item">
              <div class="label">{{ c.settings.billingSeatsLabel }}</div>
              <div class="value">{{ sub.seatLimit ?? c.settings.billingSeatsUnlimited }}</div>
            </div>
            <div class="billing-item">
              <div class="label">{{ sub.status === 'TRIALING' ? c.settings.billingTrialEndsLabel : c.settings.billingRenewsLabel }}</div>
              <div class="value">{{ (sub.status === 'TRIALING' ? sub.trialEndsAt : sub.currentPeriodEnd) ? ((sub.status === 'TRIALING' ? sub.trialEndsAt : sub.currentPeriodEnd) | date:'MMM d, y') : c.settings.billingNoExpiry }}</div>
            </div>
          </div>

          <div class="request-banner" *ngIf="latestRequest() as reqst"
               [class.rejected]="reqst.status === 'REJECTED'" [class.approved]="reqst.status === 'APPROVED'">
            <mat-icon>{{ reqst.status === 'PENDING' ? 'hourglass_top' : reqst.status === 'REJECTED' ? 'block' : 'check_circle' }}</mat-icon>
            <div style="flex:1;">
              <div class="request-banner-title">
                {{ reqst.status === 'PENDING' ? c.settings.billingRequestPendingTitle
                   : reqst.status === 'APPROVED' ? c.settings.billingRequestApprovedTitle
                   : c.settings.billingRequestRejectedTitle }}
                &mdash; {{ planLabel(reqst.requestedPlan) }}, {{ reqst.requestedSeatLimit }} {{ c.settings.billingSeatsLabel | lowercase }}
              </div>
              <div *ngIf="reqst.status === 'REJECTED' && reqst.reviewNote">{{ reqst.reviewNote }}</div>
            </div>
            <ui-button *ngIf="reqst.status === 'PENDING' && canManage()" variant="ghost" [loading]="revoking()"
                       [loadingText]="c.settings.billingRevokingButton" (click)="revoke(reqst.id)">
              {{ c.settings.billingRevokeButton }}
            </ui-button>
          </div>

          <form class="request-form" *ngIf="canManage() && sub.canRequestChange" (ngSubmit)="submitRequest()">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.billingRequestPlanLabel }}</mat-label>
              <mat-select name="requestPlan" [(ngModel)]="requestPlan" [disabled]="hasPendingRequest()">
                <mat-option value="TRIAL">{{ c.admin.PLAN_TRIAL }}</mat-option>
                <mat-option value="STARTER">{{ c.admin.PLAN_STARTER }}</mat-option>
                <mat-option value="PRO">{{ c.admin.PLAN_PRO }}</mat-option>
                <mat-option value="ENTERPRISE">{{ c.admin.PLAN_ENTERPRISE }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:120px;" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.billingRequestSeatsLabel }}</mat-label>
              <input matInput type="number" min="1" name="requestSeats" [(ngModel)]="requestSeats" [disabled]="hasPendingRequest()">
            </mat-form-field>
            <mat-form-field appearance="outline" style="flex:1;min-width:220px;" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.billingRequestNoteLabel }}</mat-label>
              <input matInput name="requestNote" [(ngModel)]="requestNote" [disabled]="hasPendingRequest()">
            </mat-form-field>
            <ui-button variant="primary" type="submit" [disabled]="hasPendingRequest() || !requestSeats"
                       [loading]="submittingRequest()" [loadingText]="c.settings.billingRequestSubmittingButton">
              {{ c.settings.billingRequestSubmitButton }}
            </ui-button>
          </form>

          <div class="canceled-note" *ngIf="!sub.canRequestChange">{{ c.settings.billingCanceledMessage }}</div>
        </ui-card>

        <ui-card [title]="c.settings.membersTitle" [caption]="c.settings.membersCaption" style="display:block;margin-top:var(--space-4);">
          <div class="invite-form">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.inviteNameLabel }}</mat-label>
              <input matInput [(ngModel)]="inviteName">
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.inviteEmailLabel }}</mat-label>
              <input matInput type="email" [(ngModel)]="inviteEmail">
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.inviteRoleLabel }}</mat-label>
              <mat-select [(ngModel)]="inviteRole">
                <mat-option value="ADMIN">Admin</mat-option>
                <mat-option value="REVIEWER">Reviewer</mat-option>
                <mat-option value="VIEWER">Viewer</mat-option>
                <mat-option value="ACKNOWLEDGER">Acknowledger (policies only)</mat-option>
              </mat-select>
            </mat-form-field>
            <ui-button variant="primary" [loading]="inviting()" [loadingText]="c.settings.invitingButton"
                       [disabled]="!inviteEmail || !inviteName"
                       (click)="invite()">
              {{ c.settings.inviteButton }}
            </ui-button>
          </div>

          <div *ngFor="let m of members()" class="member-row">
            <div class="who">
              <div class="name">{{ m.name }}</div>
              <div class="email">{{ m.email }}</div>
            </div>
            <mat-form-field appearance="outline" style="width:150px;" subscriptSizing="dynamic" *ngIf="isOwner(); else roleBadge">
              <mat-select [ngModel]="m.role" (ngModelChange)="changeRole(m, $event)">
                <mat-option value="OWNER">Owner</mat-option>
                <mat-option value="ADMIN">Admin</mat-option>
                <mat-option value="REVIEWER">Reviewer</mat-option>
                <mat-option value="VIEWER">Viewer</mat-option>
                <mat-option value="ACKNOWLEDGER">Acknowledger (policies only)</mat-option>
              </mat-select>
            </mat-form-field>
            <ng-template #roleBadge><ui-badge variant="info">{{ m.role }}</ui-badge></ng-template>
          </div>
        </ui-card>

        <ui-card [title]="c.settings.automationTitle" [caption]="c.settings.automationCaption" style="display:block;margin-top:var(--space-4);">
          <ng-container *ngIf="integrations().length; else emptyIntegrations">
            <div *ngFor="let i of integrations()" class="integration-row">
              <div class="who">
                <div class="name">{{ i.displayName ?? i.provider }}</div>
                <div class="meta">{{ i.provider }} · {{ i.status }}</div>
              </div>
              <mat-form-field appearance="outline" style="width:170px;" subscriptSizing="dynamic">
                <mat-label>{{ c.settings.scheduleLabel }}</mat-label>
                <mat-select [ngModel]="i.schedule" (ngModelChange)="changeSchedule(i, $event)">
                  <mat-option value="MANUAL">{{ c.settings.scheduleManual }}</mat-option>
                  <mat-option value="DAILY">{{ c.settings.scheduleDaily }}</mat-option>
                  <mat-option value="WEEKLY">{{ c.settings.scheduleWeekly }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </ng-container>
          <ng-template #emptyIntegrations>
            <ui-empty-state icon="hub" [title]="c.settings.automationEmptyTitle" [description]="c.settings.automationEmptyMessage"></ui-empty-state>
          </ng-template>
        </ui-card>

        <ui-card [title]="c.settings.programTitle" [caption]="c.settings.programCaption" style="display:block;margin-top:var(--space-4);">
          <div class="program-label">{{ c.settings.programScopeLabel }}</div>
          <div class="scope-row">
            <label class="scope-chip disabled"><input type="checkbox" checked disabled>{{ c.settings.programScopeSecurity }}</label>
            <label class="scope-chip"><input type="checkbox" [(ngModel)]="scopeAvailability">{{ c.settings.programScopeAvailability }}</label>
            <label class="scope-chip"><input type="checkbox" [(ngModel)]="scopeConfidentiality">{{ c.settings.programScopeConfidentiality }}</label>
          </div>

          <div class="row" style="margin-top:var(--space-5);">
            <mat-form-field appearance="outline" style="width:200px;" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.programReportTypeLabel }}</mat-label>
              <mat-select [(ngModel)]="reportType">
                <mat-option value="TYPE_I">{{ c.settings.programReportTypeI }}</mat-option>
                <mat-option value="TYPE_II">{{ c.settings.programReportTypeII }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:190px;" subscriptSizing="dynamic" *ngIf="reportType === 'TYPE_II'">
              <mat-label>{{ c.settings.programObservationStart }}</mat-label>
              <input matInput type="date" [(ngModel)]="observationPeriodStart">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:190px;" subscriptSizing="dynamic" *ngIf="reportType === 'TYPE_II'">
              <mat-label>{{ c.settings.programObservationEnd }}</mat-label>
              <input matInput type="date" [(ngModel)]="observationPeriodEnd">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:190px;" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.programTargetReportDate }}</mat-label>
              <input matInput type="date" [(ngModel)]="targetReportDate">
            </mat-form-field>
          </div>

          <div class="program-label" style="margin-top:var(--space-5);">{{ c.settings.programSystemDescriptionLabel }}</div>
          <div class="desc-grid">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.programServicesProvided }}</mat-label>
              <textarea matInput rows="3" [(ngModel)]="servicesProvided"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.programSystemBoundaries }}</mat-label>
              <textarea matInput rows="3" [(ngModel)]="systemBoundaries"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.programComponents }}</mat-label>
              <textarea matInput rows="3" [(ngModel)]="componentsDescription"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.programSubserviceOrgs }}</mat-label>
              <textarea matInput rows="3" [(ngModel)]="subserviceOrganizations"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.programCuecLabel }}</mat-label>
              <textarea matInput rows="3" [(ngModel)]="complementaryUserEntityControls"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" *ngIf="reportType === 'TYPE_II'">
              <mat-label>{{ c.settings.programSignificantChangesLabel }}</mat-label>
              <textarea matInput rows="3" [(ngModel)]="significantChangesDuringPeriod"></textarea>
            </mat-form-field>
          </div>

          <div class="row" style="margin-top:var(--space-4);">
            <ui-button variant="primary" [loading]="savingProgram()" [loadingText]="c.settings.savingButton" (click)="saveProgram()">
              {{ c.settings.saveButton }}
            </ui-button>
            <ui-button variant="ghost" [loading]="generatingDoc()" [loadingText]="c.settings.programGeneratingButton" (click)="generateSystemDescription()">
              {{ c.settings.programGenerateButton }}
            </ui-button>
            <ui-button variant="ghost" [loading]="downloadingReport()" [loadingText]="c.settings.programDownloadingButton" (click)="downloadReadinessReport()">
              {{ c.settings.programDownloadButton }}
            </ui-button>
          </div>
        </ui-card>
      </ng-container>

      <ng-template #restricted>
        <ui-card>
          <ui-empty-state icon="lock" [title]="c.settings.restrictedTitle" [description]="c.settings.restrictedMessage"></ui-empty-state>
        </ui-card>
      </ng-template>

      <ui-toast *ngIf="msg()" variant="success">{{ msg() }}</ui-toast>
      <ui-toast *ngIf="err()" variant="error">{{ err() }}</ui-toast>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  me = signal<Me | null>(null);
  org = signal<Organization | null>(null);
  members = signal<Member[]>([]);
  integrations = signal<Integration[]>([]);
  subscription = signal<SubscriptionResponse | null>(null);
  latestRequest = signal<SubscriptionRequestResponse | null>(null);
  submittingRequest = signal(false);
  revoking = signal(false);
  requestPlan: SubscriptionPlan = 'PRO';
  requestSeats: number | null = null;
  requestNote = '';

  orgName = '';
  savingOrg = signal(false);

  scopeAvailability = false;
  scopeConfidentiality = false;
  reportType: 'TYPE_I' | 'TYPE_II' = 'TYPE_I';
  observationPeriodStart = '';
  observationPeriodEnd = '';
  targetReportDate = '';
  servicesProvided = '';
  systemBoundaries = '';
  componentsDescription = '';
  subserviceOrganizations = '';
  complementaryUserEntityControls = '';
  significantChangesDuringPeriod = '';
  savingProgram = signal(false);
  generatingDoc = signal(false);
  downloadingReport = signal(false);

  inviteName = '';
  inviteEmail = '';
  inviteRole: Role = 'REVIEWER';
  inviting = signal(false);

  msg = signal<string | null>(null);
  err = signal<string | null>(null);

  canManage = computed(() => {
    const r = this.me()?.role;
    return r === 'OWNER' || r === 'ADMIN';
  });
  isOwner = computed(() => this.me()?.role === 'OWNER');

  ngOnInit(): void {
    this.api.me().subscribe(m => this.me.set(m));
    this.reload();
  }

  saveOrg(): void {
    this.savingOrg.set(true);
    this.api.updateOrganization({ name: this.orgName.trim() }).subscribe({
      next: (o) => {
        this.org.set(o);
        this.msg.set(this.c.settings.orgUpdatedToast);
        this.err.set(null);
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.settings.actionError),
      complete: () => this.savingOrg.set(false),
    });
  }

  invite(): void {
    this.inviting.set(true);
    this.api.addMember({
      email: this.inviteEmail, name: this.inviteName, role: this.inviteRole,
    }).subscribe({
      next: () => {
        this.msg.set(this.c.settings.memberAddedToast);
        this.err.set(null);
        this.inviteName = ''; this.inviteEmail = ''; this.inviteRole = 'REVIEWER';
        this.reloadMembers();
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.settings.actionError),
      complete: () => this.inviting.set(false),
    });
  }

  changeRole(member: Member, role: Role): void {
    this.api.updateMemberRole(member.id, role).subscribe({
      next: () => { this.msg.set(this.c.settings.roleUpdatedToast); this.err.set(null); this.reloadMembers(); },
      error: (e) => { this.err.set(e?.error?.message ?? this.c.settings.actionError); this.reloadMembers(); },
    });
  }

  changeSchedule(integration: Integration, schedule: ScheduleValue): void {
    this.api.updateIntegrationSchedule(integration.id, schedule).subscribe({
      next: () => { this.msg.set(this.c.settings.scheduleUpdatedToast); this.err.set(null); this.reloadIntegrations(); },
      error: (e) => { this.err.set(e?.error?.message ?? this.c.settings.actionError); this.reloadIntegrations(); },
    });
  }

  hasPendingRequest(): boolean {
    return this.latestRequest()?.status === 'PENDING';
  }

  submitRequest(): void {
    if (!this.requestSeats) return;
    this.submittingRequest.set(true);
    this.api.createSubscriptionRequest({
      requestedPlan: this.requestPlan, requestedSeatLimit: this.requestSeats, note: this.requestNote.trim() || undefined,
    }).subscribe({
      next: (req) => {
        this.latestRequest.set(req);
        this.msg.set(this.c.settings.billingRequestSubmittedToast);
        this.err.set(null);
        this.requestNote = '';
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.settings.actionError),
      complete: () => this.submittingRequest.set(false),
    });
  }

  planLabel(plan: string): string { return subscriptionPlanLabel(plan); }
  statusLabel(status: string): string { return subscriptionStatusLabel(status); }
  statusVariant(status: string) { return subscriptionStatusBadgeVariant(status); }

  revoke(requestId: string): void {
    this.revoking.set(true);
    this.api.revokeSubscriptionRequest(requestId).subscribe({
      next: () => {
        this.latestRequest.set(null);
        this.msg.set(this.c.settings.billingRequestRevokedToast);
        this.err.set(null);
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.settings.actionError),
      complete: () => this.revoking.set(false),
    });
  }

  private reload(): void {
    this.api.organization().subscribe(o => {
      this.org.set(o);
      this.orgName = o.name;
      this.scopeAvailability = o.tscScope.includes('AVAILABILITY');
      this.scopeConfidentiality = o.tscScope.includes('CONFIDENTIALITY');
      this.reportType = o.reportType;
      this.observationPeriodStart = o.observationPeriodStart ?? '';
      this.observationPeriodEnd = o.observationPeriodEnd ?? '';
      this.targetReportDate = o.targetReportDate ?? '';
      this.servicesProvided = o.servicesProvided ?? '';
      this.systemBoundaries = o.systemBoundaries ?? '';
      this.componentsDescription = o.componentsDescription ?? '';
      this.subserviceOrganizations = o.subserviceOrganizations ?? '';
      this.complementaryUserEntityControls = o.complementaryUserEntityControls ?? '';
      this.significantChangesDuringPeriod = o.significantChangesDuringPeriod ?? '';
    });
    this.api.subscription().subscribe(s => this.subscription.set(s));
    this.api.subscriptionRequests().subscribe(reqs => this.latestRequest.set(reqs[0] ?? null));
    this.reloadMembers();
    this.reloadIntegrations();
  }
  private reloadMembers(): void { this.api.members().subscribe(list => this.members.set(list)); }
  private reloadIntegrations(): void { this.api.integrations().subscribe(list => this.integrations.set(list)); }

  saveProgram(): void {
    this.savingProgram.set(true);
    const extra: string[] = [];
    if (this.scopeAvailability) extra.push('AVAILABILITY');
    if (this.scopeConfidentiality) extra.push('CONFIDENTIALITY');
    this.api.updateComplianceProgram({
      tscScopeExtra: extra,
      reportType: this.reportType,
      observationPeriodStart: this.reportType === 'TYPE_II' ? (this.observationPeriodStart || null) : null,
      observationPeriodEnd: this.reportType === 'TYPE_II' ? (this.observationPeriodEnd || null) : null,
      targetReportDate: this.targetReportDate || null,
      servicesProvided: this.servicesProvided || null,
      systemBoundaries: this.systemBoundaries || null,
      componentsDescription: this.componentsDescription || null,
      subserviceOrganizations: this.subserviceOrganizations || null,
      complementaryUserEntityControls: this.complementaryUserEntityControls || null,
      significantChangesDuringPeriod: this.reportType === 'TYPE_II' ? (this.significantChangesDuringPeriod || null) : null,
    }).subscribe({
      next: (o) => {
        this.org.set(o);
        this.msg.set(this.c.settings.programSavedToast);
        this.err.set(null);
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.settings.actionError),
      complete: () => this.savingProgram.set(false),
    });
  }

  generateSystemDescription(): void {
    this.generatingDoc.set(true);
    this.api.generateSystemDescription().subscribe({
      next: () => {
        this.msg.set(this.c.settings.programGeneratedToast);
        this.err.set(null);
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.settings.actionError),
      complete: () => this.generatingDoc.set(false),
    });
  }

  downloadReadinessReport(): void {
    this.downloadingReport.set(true);
    this.api.readinessReportBlob().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'soc2-readiness-report.txt';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.settings.actionError),
      complete: () => this.downloadingReport.set(false),
    });
  }
}
