import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '@core/api/api.service';
import {
  Control, Evidence, AuditorRequestItem, AuditorRequestType, AuditorControlReviewItem,
} from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import {
  UiCardComponent, UiEmptyStateComponent, UiControlStatusBadgeComponent, UiEvidenceStatusBadgeComponent,
  UiButtonComponent, UiBadgeComponent,
} from '@ui';

/** Read-only control detail for the invited-auditor workspace, plus the two interactive actions:
 *  request additional evidence, and mark the control as reviewed/tested. */
@Component({
  standalone: true,
  selector: 'app-auditor-control-detail',
  imports: [
    CommonModule, RouterLink, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    UiCardComponent, UiEmptyStateComponent, UiControlStatusBadgeComponent, UiEvidenceStatusBadgeComponent,
    UiButtonComponent, UiBadgeComponent,
  ],
  styles: [`
    .back { display: inline-flex; align-items: center; gap: 4px; color: var(--color-text-muted); font-size: 13px; margin-bottom: 16px; }
    .back:hover { color: var(--color-text); }
    .back mat-icon { font-size: 16px; height: 16px; width: 16px; }
    .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
    .code { color: var(--color-primary-text); font-size: 13px; margin-bottom: 2px; }
    .desc { color: var(--color-text-secondary); font-size: 13.5px; margin-top: 8px; }
    .evidence-row, .review-row, .request-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 0; border-bottom: 1px solid var(--color-divider);
    }
    .evidence-row:last-child, .review-row:last-child, .request-row:last-child { border-bottom: none; }
    .evidence-row .name { font-weight: 500; }
    .evidence-row .meta { color: var(--color-text-muted); font-size: 12.5px; margin-top: 2px; }
    .review-row .note, .request-row .message { font-size: 13.5px; }
    .review-row .meta, .request-row .meta { color: var(--color-text-muted); font-size: 12px; margin-top: 3px; }
    .action-form { display: flex; gap: 12px; align-items: end; flex-wrap: wrap; padding: 16px 0; border-bottom: 1px solid var(--color-divider); }
    .action-form mat-form-field.wide { flex: 1 1 320px; }
  `],
  template: `
    <div class="page">
      <a class="back" routerLink="/auditor/controls"><mat-icon>arrow_back</mat-icon>{{ c.auditorWorkspace.controlDetailBackLink }}</a>

      <ui-card *ngIf="control() as ctrl">
        <div class="head">
          <div>
            <div class="code">{{ ctrl.code }}</div>
            <h2 style="margin:0;">{{ ctrl.title }}</h2>
            <div class="desc">{{ ctrl.description }}</div>
          </div>
          <ui-control-status-badge [status]="ctrl.status"></ui-control-status-badge>
        </div>
      </ui-card>

      <ui-card [title]="c.auditorWorkspace.evidenceTitle" style="display:block;margin-top:var(--space-4);">
        <ng-container *ngIf="evidence().length; else emptyEvidence">
          <div class="evidence-row" *ngFor="let e of evidence()">
            <div>
              <div class="name">{{ e.name }}</div>
              <div class="meta">{{ e.sourceSystem }} \u00b7 {{ e.collectedAt | date:'MMM d, y' }}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <ui-evidence-status-badge [status]="e.status"></ui-evidence-status-badge>
              <ui-button variant="ghost" size="sm" (click)="downloadEvidence(e)">{{ c.auditorWorkspace.downloadEvidenceButton }}</ui-button>
            </div>
          </div>
        </ng-container>
        <ng-template #emptyEvidence>
          <ui-empty-state icon="description" [title]="c.auditorWorkspace.evidenceEmptyTitle" [description]="c.auditorWorkspace.evidenceEmptyMessage"></ui-empty-state>
        </ng-template>
      </ui-card>

      <ui-card [title]="c.auditorWorkspace.reviewsTitle" style="display:block;margin-top:var(--space-4);">
        <div class="action-form">
          <mat-form-field appearance="outline" class="wide" subscriptSizing="dynamic">
            <mat-label>{{ c.auditorWorkspace.markReviewedNoteLabel }}</mat-label>
            <input matInput [(ngModel)]="reviewNote">
          </mat-form-field>
          <ui-button variant="primary" [loading]="markingReviewed()" [loadingText]="c.auditorWorkspace.markingReviewedButton" (click)="markReviewed()">
            {{ c.auditorWorkspace.markReviewedButton }}
          </ui-button>
        </div>
        <ng-container *ngIf="reviews().length; else emptyReviews">
          <div class="review-row" *ngFor="let r of reviews()">
            <div>
              <div class="note" *ngIf="r.note">{{ r.note }}</div>
              <div class="meta">{{ r.reviewedByName }} \u00b7 {{ r.reviewedAt | date:'MMM d, y, h:mm a' }}</div>
            </div>
          </div>
        </ng-container>
        <ng-template #emptyReviews>
          <div class="meta" style="padding:8px 0;color:var(--color-text-muted);">{{ c.auditorWorkspace.reviewsEmptyMessage }}</div>
        </ng-template>
      </ui-card>

      <ui-card [title]="c.auditorWorkspace.requestsTitle" style="display:block;margin-top:var(--space-4);">
        <div class="action-form">
          <mat-form-field appearance="outline" style="width:200px;" subscriptSizing="dynamic">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="requestType">
              <mat-option value="EVIDENCE_REQUEST">{{ c.settings.requestTypeEvidenceRequest }}</mat-option>
              <mat-option value="REVIEW_NOTE">{{ c.settings.requestTypeReviewNote }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="wide" subscriptSizing="dynamic">
            <mat-label>{{ c.auditorWorkspace.requestMessageLabel }}</mat-label>
            <input matInput [(ngModel)]="requestMessage" [placeholder]="c.auditorWorkspace.requestMessagePlaceholder">
          </mat-form-field>
          <ui-button variant="primary" [disabled]="!requestMessage.trim()" [loading]="sendingRequest()"
                     [loadingText]="c.auditorWorkspace.sendingRequestButton" (click)="sendRequest()">
            {{ c.auditorWorkspace.sendRequestButton }}
          </ui-button>
        </div>
        <ng-container *ngIf="requests().length">
          <div class="request-row" *ngFor="let r of requests()">
            <div>
              <div class="message">{{ r.message }}</div>
              <div class="meta">{{ r.createdAt | date:'MMM d, y' }}</div>
            </div>
            <ui-badge [variant]="r.status === 'OPEN' ? 'warning' : 'success'">
              {{ r.status === 'OPEN' ? c.settings.requestStatusOpen : c.settings.requestStatusResolved }}
            </ui-badge>
          </div>
        </ng-container>
      </ui-card>
    </div>
  `,
})
export class AuditorControlDetailComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  private controlId = '';

  control = signal<Control | null>(null);
  evidence = signal<Evidence[]>([]);
  reviews = signal<AuditorControlReviewItem[]>([]);
  requests = signal<AuditorRequestItem[]>([]);

  reviewNote = '';
  markingReviewed = signal(false);

  requestType: AuditorRequestType = 'EVIDENCE_REQUEST';
  requestMessage = '';
  sendingRequest = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (!id) return;
      this.controlId = id;
      this.reload();
    });
  }

  private reload(): void {
    this.api.auditorControl(this.controlId).subscribe(c => this.control.set(c));
    this.api.auditorControlEvidence(this.controlId).subscribe(e => this.evidence.set(e));
    this.api.auditorControlReviews(this.controlId).subscribe(r => this.reviews.set(r));
    this.api.auditorMyRequests().subscribe(all => this.requests.set(all.filter(r => r.controlId === this.controlId)));
  }

  downloadEvidence(e: Evidence): void {
    this.api.auditorEvidenceDownloadBlob(e.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = e.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }

  markReviewed(): void {
    this.markingReviewed.set(true);
    this.api.auditorMarkReviewed(this.controlId, this.reviewNote.trim() || undefined).subscribe({
      next: (r) => {
        this.reviews.set([r, ...this.reviews()]);
        this.reviewNote = '';
      },
      complete: () => this.markingReviewed.set(false),
    });
  }

  sendRequest(): void {
    if (!this.requestMessage.trim()) return;
    this.sendingRequest.set(true);
    this.api.auditorCreateRequest(this.controlId, { type: this.requestType, message: this.requestMessage.trim() }).subscribe({
      next: (r) => {
        this.requests.set([r, ...this.requests()]);
        this.requestMessage = '';
      },
      complete: () => this.sendingRequest.set(false),
    });
  }
}
