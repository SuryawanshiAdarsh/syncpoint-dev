import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '../../core/api/api.service';
import { CAPTIONS } from '@captions';
import { MAPPING_TYPE } from '@constants';
import { ControlMapping, AiAnalysisSummary, MappingType, Control, Member, ControlException, AuditorRequestItem, AuditorControlReviewItem } from '../../core/api/api.types';
import {
  UiCardComponent,
  UiEmptyStateComponent,
  UiControlStatusBadgeComponent,
  UiEvidenceStatusBadgeComponent,
  UiSourcePillComponent,
  UiBadgeComponent,
  UiBadgeVariant,
} from '@ui';

@Component({
  standalone: true,
  selector: 'app-control-detail',
  imports: [
    CommonModule, RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    UiCardComponent, UiEmptyStateComponent, UiControlStatusBadgeComponent,
    UiEvidenceStatusBadgeComponent, UiSourcePillComponent, UiBadgeComponent,
  ],
  styles: [`
    .back {
      display: inline-flex; align-items: center; gap: 4px;
      color: var(--color-text-muted); font-size: 13px; margin-bottom: 16px;
      transition: color var(--transition-fast);
    }
    .back:hover { color: var(--color-text); }
    .back mat-icon { font-size: 16px; height: 16px; width: 16px; }

    .hero {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 28px 32px;
      margin-bottom: var(--space-4);
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.06), transparent 50%);
      pointer-events: none;
    }
    .hero > * { position: relative; z-index: 1; }
    .hero-top { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 16px; }
    .hero-top .code {
      font-family: var(--font-mono);
      font-size: 12px; font-weight: 600;
      color: var(--color-primary-text);
      background: var(--color-primary-soft);
      border: 1px solid #c7d2fe;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .hero-top .cat {
      font-size: 12px;
      color: var(--color-text-secondary);
      padding: 3px 10px;
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: 999px;
    }
    .hero h1 { font-size: 26px; margin-bottom: 8px; letter-spacing: -0.02em; }
    .hero .desc { color: var(--color-text-secondary); font-size: 14px; line-height: 1.65; max-width: 780px; margin-bottom: 8px; }

    .meta { display: flex; gap: 24px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-divider); }
    .meta .item .label { color: var(--color-text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    .meta .item .val { font-size: 14px; font-weight: 500; margin-top: 3px; }

    .row-actions { display: flex; gap: 6px; align-items: center; justify-content: flex-end; }
    .confidence-note { color: var(--color-text-muted); font-size: 12px; margin-top: 2px; }

    .analysis-row {
      display: flex; flex-direction: column; gap: 8px;
      padding: 16px 24px;
      border-bottom: 1px solid var(--color-divider);
    }
    .analysis-row:last-child { border-bottom: none; }
    .analysis-row .head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .analysis-row .evidence-name { font-weight: 500; }
    .analysis-row .provider { color: var(--color-text-muted); font-size: 12px; }
    .analysis-row .reason { color: var(--color-text-secondary); font-size: 13.5px; line-height: 1.6; }
    .confidence-bar {
      height: 6px; border-radius: var(--radius-full);
      background: var(--color-surface-muted);
      overflow: hidden;
      max-width: 220px;
    }
    .confidence-bar .fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); }

    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      background: var(--color-success-soft);
      border: 1px solid var(--color-success-border);
      border-radius: var(--radius-md);
      color: var(--color-success-text);
      font-size: 13.5px;
      margin-top: 12px;
    }
    .toast.error { background: var(--color-danger-soft); border-color: var(--color-danger-border); color: var(--color-danger-text); }
    .toast mat-icon { font-size: 18px; height: 18px; width: 18px; }

    .exception-row {
      display: flex; align-items: flex-start; gap: 12px; justify-content: space-between;
      padding: 12px 24px; border-bottom: 1px solid var(--color-divider);
    }
    .exception-row:last-child { border-bottom: none; }
    .exception-row .desc { font-size: 13.5px; }
    .exception-row .dates { color: var(--color-text-muted); font-size: 12px; margin-top: 3px; }
    .exception-form { display: flex; gap: 12px; align-items: end; flex-wrap: wrap; padding: 16px 24px; border-bottom: 1px solid var(--color-divider); }
    .exception-form mat-form-field.desc-field { flex: 1 1 320px; }
  `],
  template: `
    <div class="page">
      <a routerLink="/controls" class="back"><mat-icon>arrow_back</mat-icon> {{ c.controlDetail.backToControls }}</a>

      <ng-container *ngIf="control() as ctrl">
        <div class="hero">
          <div class="hero-top">
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                <span class="code">{{ ctrl.code }}</span>
                <span class="cat">{{ ctrl.category }}</span>
                <span class="cat">Framework: {{ ctrl.frameworkCode }}</span>
              </div>
              <h1>{{ ctrl.title }}</h1>
              <p class="desc">{{ ctrl.description }}</p>
            </div>
            <ui-control-status-badge [status]="ctrl.status"></ui-control-status-badge>
          </div>

          <div class="meta">
            <div class="item">
              <div class="label">Mapped evidence</div>
              <div class="val">{{ mappings().length }}</div>
            </div>
            <div class="item">
              <div class="label">Confirmed</div>
              <div class="val">{{ confirmedCount() }}</div>
            </div>
            <div class="item">
              <div class="label">Needs review</div>
              <div class="val">{{ needsReviewCount() }}</div>
            </div>
            <div class="item">
              <div class="label">{{ c.controlDetail.ownerLabel }}</div>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" style="width:200px;">
                <mat-select [ngModel]="ctrl.ownerUserId ?? null" (ngModelChange)="assignOwner($event)">
                  <mat-option [value]="null">{{ c.controlDetail.ownerPlaceholder }}</mat-option>
                  <mat-option *ngFor="let m of members()" [value]="m.userId">{{ m.name }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </div>

        <ui-card [title]="c.controlDetail.mappedEvidenceTitle" [caption]="c.controlDetail.mappedEvidenceCaption" padding="flush">
          <a header-actions class="btn ghost sm" [routerLink]="['/evidence']" [queryParams]="{ control: ctrl.code, fromControl: ctrl.id, fromControlCode: ctrl.code }">
            <mat-icon>upload</mat-icon>{{ c.controlDetail.uploadEvidence }}
          </a>

          <table class="data-table" *ngIf="mappings().length; else emptyMappings">
            <thead><tr>
              <th style="padding-left:24px;">{{ c.evidence.tableName }}</th>
              <th>{{ c.evidence.tableSource }}</th>
              <th>{{ c.evidence.tableStatus }}</th>
              <th>{{ c.controlDetail.tableMapping }}</th>
              <th>{{ c.controlDetail.tableClassification }}</th>
              <th style="text-align:right;padding-right:24px;">{{ c.controlDetail.tableActions }}</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let m of mappings()">
                <td style="padding-left:24px;">
                  <div style="font-weight:500;">{{ m.evidenceName }}</div>
                  <div class="muted small" *ngIf="m.collectedAt">{{ m.collectedAt | date:'MMM d, y' }}</div>
                </td>
                <td><ui-source-pill *ngIf="m.sourceType" [source]="m.sourceType"></ui-source-pill></td>
                <td><ui-evidence-status-badge *ngIf="m.evidenceStatus" [status]="m.evidenceStatus"></ui-evidence-status-badge></td>
                <td>
                  <ui-badge [variant]="mappingTypeVariant(m.mappingType)">{{ mappingTypeLabel(m.mappingType) }}</ui-badge>
                </td>
                <td>
                  <div>{{ m.classification ? (m.classification | titlecase) : '—' }}</div>
                  <div class="confidence-note" *ngIf="m.confidence != null">{{ c.controlDetail.confidenceLabel(m.confidence) }}</div>
                </td>
                <td style="padding-right:24px;">
                  <div class="row-actions" *ngIf="m.mappingType === aiSuggested; else noAction">
                    <button class="btn primary sm" (click)="confirm(m)" [disabled]="busy()[m.mappingId]">
                      <mat-icon style="font-size:14px;height:14px;width:14px;">check</mat-icon>{{ c.controlDetail.confirmMapping }}
                    </button>
                    <button class="btn ghost sm" (click)="reject(m)" [disabled]="busy()[m.mappingId]">
                      <mat-icon style="font-size:14px;height:14px;width:14px;">close</mat-icon>{{ c.controlDetail.rejectMapping }}
                    </button>
                  </div>
                  <ng-template #noAction><span class="muted small">—</span></ng-template>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #emptyMappings>
            <ui-empty-state
              icon="find_in_page"
              [title]="c.controlDetail.mappedEvidenceEmptyTitle"
              [description]="c.controlDetail.mappedEvidenceEmptyMessage">
            </ui-empty-state>
          </ng-template>
        </ui-card>

        <ui-card
          [title]="c.controlDetail.aiAnalysisTitle"
          [caption]="c.controlDetail.aiAnalysisCaption"
          padding="flush"
          style="display:block;margin-top: var(--space-4);">
          <ng-container *ngIf="aiAnalyses().length; else emptyAnalyses">
            <div class="analysis-row" *ngFor="let a of aiAnalyses()">
              <div class="head">
                <span class="evidence-name">{{ a.evidenceName }}</span>
                <span class="provider">{{ a.provider }} · {{ a.model }}</span>
              </div>
              <div *ngIf="a.confidence != null" class="confidence-bar">
                <div class="fill" [style.width.%]="a.confidence * 100"></div>
              </div>
              <p class="reason" *ngIf="a.reason">{{ a.reason }}</p>
            </div>
          </ng-container>
          <ng-template #emptyAnalyses>
            <ui-empty-state
              icon="auto_awesome"
              [title]="c.controlDetail.aiAnalysisEmptyTitle"
              [description]="c.controlDetail.aiAnalysisEmptyMessage">
            </ui-empty-state>
          </ng-template>
        </ui-card>

        <ui-card
          [title]="c.controlDetail.exceptionsTitle"
          [caption]="c.controlDetail.exceptionsCaption"
          padding="flush"
          style="display:block;margin-top: var(--space-4);">
          <div class="exception-form">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="desc-field">
              <mat-label>{{ c.controlDetail.exceptionDescriptionLabel }}</mat-label>
              <input matInput [(ngModel)]="exceptionDescription" [placeholder]="c.controlDetail.exceptionDescriptionPlaceholder">
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic" style="width:170px;">
              <mat-label>{{ c.controlDetail.exceptionDetectedDateLabel }}</mat-label>
              <input matInput type="date" [(ngModel)]="exceptionDetectedDate">
            </mat-form-field>
            <button class="btn primary sm" [disabled]="!exceptionDescription.trim() || !exceptionDetectedDate || loggingException()" (click)="logException()">
              {{ c.controlDetail.logExceptionButton }}
            </button>
          </div>

          <ng-container *ngIf="exceptions().length; else emptyExceptions">
            <div class="exception-row" *ngFor="let e of exceptions()">
              <div style="flex:1;">
                <div class="desc">{{ e.description }}</div>
                <div class="dates">
                  {{ c.controlDetail.exceptionDetectedDateLabel }}: {{ e.detectedDate | date:'MMM d, y' }}
                  <ng-container *ngIf="e.remediatedDate"> · {{ c.controlDetail.remediatedDateLabel }}: {{ e.remediatedDate | date:'MMM d, y' }}</ng-container>
                </div>
              </div>
              <ui-badge [variant]="e.status === 'OPEN' ? 'warning' : 'success'">
                {{ e.status === 'OPEN' ? c.controlDetail.statusOpen : c.controlDetail.statusRemediated }}
              </ui-badge>
              <button *ngIf="e.status === 'OPEN'" class="btn ghost sm" (click)="remediateException(e)">
                <mat-icon style="font-size:14px;height:14px;width:14px;">check</mat-icon>{{ c.controlDetail.remediateButton }}
              </button>
              <button class="btn ghost sm" (click)="deleteException(e)">
                <mat-icon style="font-size:14px;height:14px;width:14px;">delete</mat-icon>
              </button>
            </div>
          </ng-container>
          <ng-template #emptyExceptions>
            <ui-empty-state
              icon="rule"
              [title]="c.controlDetail.exceptionsEmptyTitle"
              [description]="c.controlDetail.exceptionsEmptyMessage">
            </ui-empty-state>
          </ng-template>
        </ui-card>

        <ui-card [title]="c.controlDetail.auditorActivityTitle" [caption]="c.controlDetail.auditorActivityCaption"
                 style="display:block;margin-top: var(--space-4);" *ngIf="auditorRequests().length || auditorReviews().length">
          <div class="exception-row" *ngFor="let r of auditorRequests()">
            <div style="flex:1;">
              <div class="desc">{{ r.message }}</div>
              <div class="dates">{{ r.createdByName }} · {{ r.createdAt | date:'MMM d, y' }}</div>
            </div>
            <ui-badge [variant]="r.status === 'OPEN' ? 'warning' : 'success'">{{ r.status }}</ui-badge>
          </div>
          <div class="exception-row" *ngFor="let r of auditorReviews()">
            <div style="flex:1;">
              <div class="desc">{{ c.controlDetail.auditorReviewedPrefix }}{{ r.note ? ': ' + r.note : '' }}</div>
              <div class="dates">{{ r.reviewedByName }} · {{ r.reviewedAt | date:'MMM d, y' }}</div>
            </div>
          </div>
        </ui-card>
      </ng-container>

      <div *ngIf="msg() as m" class="toast" [class.error]="msgIsError()">
        <mat-icon>{{ msgIsError() ? 'error_outline' : 'check_circle' }}</mat-icon>{{ m }}
      </div>
    </div>
  `,
})
export class ControlDetailComponent implements OnInit {
  readonly c = CAPTIONS;
  readonly aiSuggested: MappingType = MAPPING_TYPE.AI_SUGGESTED;
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  private controlId = '';
  control = signal<Control | null>(null);
  mappings = signal<ControlMapping[]>([]);
  aiAnalyses = signal<AiAnalysisSummary[]>([]);
  members = signal<Member[]>([]);
  exceptions = signal<ControlException[]>([]);
  exceptionDescription = '';
  exceptionDetectedDate = '';
  loggingException = signal(false);
  auditorRequests = signal<AuditorRequestItem[]>([]);
  auditorReviews = signal<AuditorControlReviewItem[]>([]);
  busy = signal<Record<string, boolean>>({});
  msg = signal<string | null>(null);
  msgIsError = signal(false);

  confirmedCount = computed(() =>
    this.mappings().filter(m => m.mappingType === MAPPING_TYPE.HUMAN_CONFIRMED).length);
  needsReviewCount = computed(() =>
    this.mappings().filter(m => m.mappingType === MAPPING_TYPE.AI_SUGGESTED).length);

  ngOnInit(): void {
    this.api.members().subscribe(m => this.members.set(m));
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (!id) return;
      this.controlId = id;
      this.reload();
    });
  }

  assignOwner(userId: string | null): void {
    this.api.assignControlOwner(this.controlId, userId).subscribe({
      next: (ctrl) => {
        this.control.set(ctrl);
        this.msg.set(this.c.controlDetail.ownerAssignedToast);
        this.msgIsError.set(false);
      },
      error: () => {
        this.msg.set(this.c.controlDetail.mappingActionError);
        this.msgIsError.set(true);
      },
    });
  }

  confirm(m: ControlMapping): void {
    this.busy.update(x => ({ ...x, [m.mappingId]: true }));
    this.api.confirmMapping(m.evidenceId, m.mappingId).subscribe({
      next: () => {
        this.msg.set(this.c.controlDetail.mappingConfirmedToast);
        this.msgIsError.set(false);
        this.reload();
      },
      error: () => {
        this.msg.set(this.c.controlDetail.mappingActionError);
        this.msgIsError.set(true);
      },
      complete: () => this.busy.update(x => ({ ...x, [m.mappingId]: false })),
    });
  }

  reject(m: ControlMapping): void {
    this.busy.update(x => ({ ...x, [m.mappingId]: true }));
    this.api.rejectMapping(m.evidenceId, m.mappingId).subscribe({
      next: () => {
        this.msg.set(this.c.controlDetail.mappingRejectedToast);
        this.msgIsError.set(false);
        this.reload();
      },
      error: () => {
        this.msg.set(this.c.controlDetail.mappingActionError);
        this.msgIsError.set(true);
      },
      complete: () => this.busy.update(x => ({ ...x, [m.mappingId]: false })),
    });
  }

  mappingTypeLabel(t: MappingType): string {
    return ({
      AI_SUGGESTED: this.c.controlDetail.mappingTypeAiSuggested,
      HUMAN_CONFIRMED: this.c.controlDetail.mappingTypeHumanConfirmed,
      HUMAN_REJECTED: this.c.controlDetail.mappingTypeHumanRejected,
    } as const)[t];
  }

  mappingTypeVariant(t: MappingType): UiBadgeVariant {
    return ({
      AI_SUGGESTED: 'needs-review',
      HUMAN_CONFIRMED: 'approved',
      HUMAN_REJECTED: 'rejected',
    } as const)[t];
  }

  private reload(): void {
    if (!this.controlId) return;
    this.api.control(this.controlId).subscribe(c => this.control.set(c));
    this.api.controlMappings(this.controlId).subscribe(m => this.mappings.set(m));
    this.api.controlAiAnalyses(this.controlId).subscribe(a => this.aiAnalyses.set(a));
    this.api.controlExceptions(this.controlId).subscribe(e => this.exceptions.set(e));
    this.api.controlAuditorRequests(this.controlId).subscribe(r => this.auditorRequests.set(r));
    this.api.controlAuditorReviews(this.controlId).subscribe(r => this.auditorReviews.set(r));
  }

  logException(): void {
    if (!this.exceptionDescription.trim() || !this.exceptionDetectedDate) return;
    this.loggingException.set(true);
    this.api.logControlException(this.controlId, {
      description: this.exceptionDescription.trim(),
      detectedDate: this.exceptionDetectedDate,
    }).subscribe({
      next: () => {
        this.msg.set(this.c.controlDetail.exceptionLoggedToast);
        this.msgIsError.set(false);
        this.exceptionDescription = '';
        this.exceptionDetectedDate = '';
        this.api.controlExceptions(this.controlId).subscribe(e => this.exceptions.set(e));
      },
      error: () => {
        this.msg.set(this.c.controlDetail.mappingActionError);
        this.msgIsError.set(true);
      },
      complete: () => this.loggingException.set(false),
    });
  }

  remediateException(e: ControlException): void {
    const today = new Date().toISOString().slice(0, 10);
    this.api.remediateControlException(this.controlId, e.id, today).subscribe({
      next: (updated) => {
        this.exceptions.set(this.exceptions().map(x => x.id === updated.id ? updated : x));
        this.msg.set(this.c.controlDetail.exceptionRemediatedToast);
        this.msgIsError.set(false);
      },
      error: () => {
        this.msg.set(this.c.controlDetail.mappingActionError);
        this.msgIsError.set(true);
      },
    });
  }

  deleteException(e: ControlException): void {
    this.api.deleteControlException(this.controlId, e.id).subscribe({
      next: () => {
        this.exceptions.set(this.exceptions().filter(x => x.id !== e.id));
        this.msg.set(this.c.controlDetail.exceptionDeletedToast);
        this.msgIsError.set(false);
      },
      error: () => {
        this.msg.set(this.c.controlDetail.mappingActionError);
        this.msgIsError.set(true);
      },
    });
  }
}
