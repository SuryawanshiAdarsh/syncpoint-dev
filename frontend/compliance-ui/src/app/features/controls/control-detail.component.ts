import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '../../core/api/api.service';
import { CAPTIONS } from '@captions';
import { Control, Evidence } from '../../core/api/api.types';

@Component({
  standalone: true,
  selector: 'app-control-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
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

    .status-large { padding: 6px 14px; font-size: 13px; }

    .meta { display: flex; gap: 24px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-divider); }
    .meta .item .label { color: var(--color-text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
    .meta .item .val { font-size: 14px; font-weight: 500; margin-top: 3px; }
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
            <span class="badge status-large" [class]="statusClass(ctrl.status)">{{ statusLabel(ctrl.status) }}</span>
          </div>

          <div class="meta">
            <div class="item">
              <div class="label">Mapped evidence</div>
              <div class="val">{{ evidence().length }}</div>
            </div>
            <div class="item">
              <div class="label">Approved</div>
              <div class="val">{{ approvedCount() }}</div>
            </div>
            <div class="item">
              <div class="label">Under review</div>
              <div class="val">{{ underReviewCount() }}</div>
            </div>
          </div>
        </div>

        <div class="card" style="padding: 0;">
          <div style="padding: 20px 24px 12px;">
            <h2>{{ c.controlDetail.mappedEvidenceTitle }}</h2>
            <p class="muted small" style="margin-top: 4px;">{{ c.controlDetail.mappedEvidenceCaption }}</p>
          </div>

          <table class="data-table" *ngIf="evidence().length; else empty">
            <thead><tr>
              <th style="padding-left:24px;">{{ c.evidence.tableName }}</th>
              <th>{{ c.evidence.tableSource }}</th>
              <th>{{ c.evidence.tableStatus }}</th>
              <th style="text-align:right;padding-right:24px;">Collected</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let e of evidence()">
                <td style="padding-left:24px;">
                  <div style="font-weight:500;">{{ e.name }}</div>
                  <div class="muted small" *ngIf="e.description">{{ e.description }}</div>
                </td>
                <td><span class="source-pill" style="display:inline-flex;align-items:center;gap:6px;padding:2px 8px;background:var(--color-surface-muted);border:1px solid var(--color-border);border-radius:999px;font-size:12px;color:var(--color-text-secondary);">
                    <mat-icon style="font-size:12px;height:12px;width:12px;">{{ sourceIcon(e.sourceType) }}</mat-icon>{{ sourceLabel(e.sourceType) }}</span></td>
                <td><span class="badge" [class]="evStatusClass(e.status)">{{ e.status | titlecase }}</span></td>
                <td class="muted small" style="text-align:right;padding-right:24px;">{{ e.collectedAt | date:'MMM d, y' }}</td>
              </tr>
            </tbody>
          </table>

          <ng-template #empty>
            <div class="empty">
              <div class="icon-wrap"><mat-icon>find_in_page</mat-icon></div>
              <h3>{{ c.controlDetail.mappedEvidenceEmptyTitle }}</h3>
              <p style="max-width: 380px;">{{ c.controlDetail.mappedEvidenceEmptyMessage }}</p>
            </div>
          </ng-template>
        </div>
      </ng-container>
    </div>
  `,
})
export class ControlDetailComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  control = signal<Control | null>(null);
  evidence = signal<Evidence[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe(pm => {
      const id = pm.get('id');
      if (!id) return;
      this.api.control(id).subscribe(c => this.control.set(c));
      this.api.controlEvidence(id).subscribe(e => this.evidence.set(e));
    });
  }

  approvedCount(): number { return this.evidence().filter(e => e.status === 'APPROVED').length; }
  underReviewCount(): number { return this.evidence().filter(e => e.status === 'UNDER_REVIEW' || e.status === 'COLLECTED').length; }

  statusClass(s: string): string { return { COVERED: 'covered', PARTIAL: 'partial', MISSING: 'missing', NEEDS_REVIEW: 'needs-review' }[s] ?? ''; }
  statusLabel(s: string): string { return { COVERED: 'Covered', PARTIAL: 'Partial', MISSING: 'Missing', NEEDS_REVIEW: 'Needs review' }[s] ?? s; }
  evStatusClass(s: string): string { return { APPROVED: 'approved', COLLECTED: 'pending', UNDER_REVIEW: 'running', REJECTED: 'rejected', EXPIRED: 'error' }[s] ?? ''; }
  sourceIcon(s: string): string { return { MANUAL_UPLOAD: 'upload_file', GITHUB: 'code', AWS: 'cloud', JIRA: 'bug_report', GOOGLE_WORKSPACE: 'groups' }[s] ?? 'description'; }
  sourceLabel(s: string): string { return { MANUAL_UPLOAD: 'Manual', GITHUB: 'GitHub', AWS: 'AWS', JIRA: 'Jira', GOOGLE_WORKSPACE: 'Google' }[s] ?? s; }
}
