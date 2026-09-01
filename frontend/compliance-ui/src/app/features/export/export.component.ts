import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription, timer } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import { ExportJob } from '../../core/api/api.types';
import { UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent } from '@ui';
import { CAPTIONS } from '@captions';

@Component({
  standalone: true,
  selector: 'app-export',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule,
            UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent],
  styles: [`
    .hero-card {
      background: linear-gradient(135deg, #0b1220 0%, #1e1b4b 60%, #4c1d95 100%);
      color: #fff;
      border-radius: var(--radius-xl);
      padding: 32px 36px;
      position: relative;
      overflow: hidden;
      margin-bottom: var(--space-6);
    }
    .hero-card::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.30), transparent 55%);
      pointer-events: none;
    }
    .hero-card > * { position: relative; z-index: 1; }
    .hero-card .icon-large {
      width: 56px; height: 56px; border-radius: var(--radius-lg);
      background: rgba(255, 255, 255, 0.10);
      display: grid; place-items: center;
      margin-bottom: 20px;
      backdrop-filter: blur(6px);
    }
    .hero-card .icon-large mat-icon { color: #fff; font-size: 28px; height: 28px; width: 28px; }
    .hero-card h1 { color: #fff; font-size: 26px; letter-spacing: -0.02em; }
    .hero-card p { color: #cbd5e1; font-size: 14px; margin-top: 10px; max-width: 640px; line-height: 1.6; }

    /* Package contents preview */
    .contents {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
      margin-top: 24px;
    }
    @media (max-width: 900px) { .contents { grid-template-columns: repeat(2, 1fr); } }
    .content-tile {
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-md);
      padding: 14px;
      display: flex; align-items: center; gap: 10px;
    }
    .content-tile mat-icon { color: #a5b4fc; font-size: 18px; height: 18px; width: 18px; flex-shrink: 0; }
    .content-tile .title { color: #fff; font-size: 12.5px; font-weight: 500; }
    .content-tile .sub { color: #94a3b8; font-size: 11px; }

    /* Job card */
    .job-hero {
      display: flex; align-items: center; gap: 20px;
      padding: 20px;
      background: var(--color-surface-muted);
      border-radius: var(--radius-lg);
      margin-bottom: 16px;
    }
    .job-icon {
      width: 48px; height: 48px; border-radius: var(--radius-lg);
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .job-icon.pending { background: var(--color-neutral-soft); color: var(--color-text-muted); }
    .job-icon.running { background: var(--color-primary-soft); color: var(--color-primary); }
    .job-icon.completed { background: var(--color-success-soft); color: var(--color-success-text); }
    .job-icon.failed { background: var(--color-danger-soft); color: var(--color-danger-text); }
    .job-icon mat-icon { font-size: 24px; height: 24px; width: 24px; }
    .job-icon .spinner {
      width: 22px; height: 22px; border-radius: 50%;
      border: 2px solid rgba(99, 102, 241, 0.2);
      border-top-color: var(--color-primary);
      animation: spin 720ms linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .job-body { flex: 1; }
    .job-title { font-size: 15px; font-weight: 600; }
    .job-sub { color: var(--color-text-muted); font-size: 12.5px; margin-top: 2px; }

    .zip-preview {
      background: #0b1220;
      color: #cbd5e1;
      font-family: var(--font-mono);
      font-size: 12px;
      border-radius: var(--radius-md);
      padding: 16px 20px;
      line-height: 1.7;
    }
    .zip-preview .path { color: #cbd5e1; }
    .zip-preview .dir  { color: #93c5fd; }
    .zip-preview .file { color: #a5b4fc; }
    .zip-preview .note { color: #64748b; margin-left: 8px; }
  `],
  template: `
    <div class="page">
      <ui-page-header
        [eyebrow]="c.export.eyebrow"
        [title]="c.export.title"
        [subtitle]="c.export.heroSubtitle">
      </ui-page-header>

      <div class="hero-card">
        <div class="icon-large"><mat-icon>inventory_2</mat-icon></div>
        <h1>{{ c.export.heroHeadline }}</h1>
        <p>{{ c.export.heroSubtitle }}</p>

        <div class="contents">
          <div class="content-tile">
            <mat-icon>description</mat-icon>
            <div><div class="title">README.txt</div><div class="sub">{{ c.export.contentReadme }}</div></div>
          </div>
          <div class="content-tile">
            <mat-icon>table_chart</mat-icon>
            <div><div class="title">index.csv</div><div class="sub">{{ c.export.contentIndex }}</div></div>
          </div>
          <div class="content-tile">
            <mat-icon>folder</mat-icon>
            <div><div class="title">controls/</div><div class="sub">{{ c.export.contentControls }}</div></div>
          </div>
          <div class="content-tile">
            <mat-icon>data_object</mat-icon>
            <div><div class="title">audit-log.json</div><div class="sub">{{ c.export.contentAudit }}</div></div>
          </div>
        </div>

        <div style="margin-top: 24px;">
          <button class="btn primary" (click)="start()" [disabled]="starting() || (job()?.status === 'RUNNING' || job()?.status === 'QUEUED')" style="background: #fff; color: #4338ca; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <mat-icon>package</mat-icon>
            {{ starting() ? c.export.generatingButton : c.export.generateButton }}
          </button>
        </div>
      </div>

      <!-- Job status -->
      <ui-card *ngIf="job() as j"
               [title]="c.export.latestExportTitle"
               [caption]="c.export.latestExportCaption">
        <div class="job-hero">
          <div class="job-icon" [class]="jobIconClass(j.status)">
            <div class="spinner" *ngIf="j.status === 'RUNNING' || j.status === 'QUEUED'"></div>
            <mat-icon *ngIf="j.status === 'COMPLETED'">check_circle</mat-icon>
            <mat-icon *ngIf="j.status === 'FAILED'">error</mat-icon>
          </div>
          <div class="job-body">
            <div class="job-title">{{ statusLabel(j.status) }}</div>
            <div class="job-sub">
              <ng-container *ngIf="j.status === 'COMPLETED' && j.sizeBytes">{{ (j.sizeBytes / 1024) | number:'1.0-1' }} KB · Built {{ j.completedAt | date:'MMM d, h:mm a' }}</ng-container>
              <ng-container *ngIf="j.status !== 'COMPLETED' && j.status !== 'FAILED'">Started {{ j.startedAt | date:'h:mm:ss a' }}</ng-container>
              <ng-container *ngIf="j.errorMessage">{{ j.errorMessage }}</ng-container>
            </div>
          </div>

          <a *ngIf="j.status === 'COMPLETED'" [href]="downloadUrl(j.id)" download="syncpoint-audit-package.zip" class="btn primary">
            <mat-icon>download</mat-icon>{{ c.export.downloadButton }}
          </a>
        </div>

        <mat-progress-bar *ngIf="j.status === 'RUNNING' || j.status === 'QUEUED'" mode="indeterminate"></mat-progress-bar>

        <div style="margin-top: 20px;" *ngIf="j.status === 'COMPLETED'">
          <div class="muted small" style="margin-bottom: 8px;">Package structure</div>
          <div class="zip-preview">
            <div><span class="path">soc2-evidence-package.zip</span></div>
            <div>├── <span class="file">README.txt</span></div>
            <div>├── <span class="file">index.csv</span></div>
            <div>├── <span class="dir">controls/</span></div>
            <div>│&nbsp;&nbsp;&nbsp;├── <span class="dir">CC6.1/</span></div>
            <div>│&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span class="file">evidence.json</span></div>
            <div>│&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── <span class="dir">evidence-files/</span></div>
            <div>│&nbsp;&nbsp;&nbsp;└── <span class="note">…other controls</span></div>
            <div>└── <span class="file">audit-log.json</span></div>
          </div>
        </div>
      </ui-card>

      <!-- Empty state -->
      <ui-card *ngIf="!job()" padding="flush">
        <ui-empty-state
          icon="inventory_2"
          [title]="c.export.emptyTitle"
          [description]="c.export.emptyMessage">
        </ui-empty-state>
      </ui-card>
    </div>
  `,
})
export class ExportComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  starting = signal(false);
  job = signal<ExportJob | null>(null);
  private poll?: Subscription;

  ngOnInit(): void {}

  start(): void {
    this.starting.set(true);
    this.api.startExport().subscribe({
      next: (j) => {
        this.job.set(j);
        this.pollUntilDone(j.id);
      },
      complete: () => this.starting.set(false),
    });
  }

  private pollUntilDone(id: string): void {
    this.poll?.unsubscribe();
    this.poll = timer(0, 2000).subscribe(() => {
      this.api.exportStatus(id).subscribe(j => {
        this.job.set(j);
        if (j.status === 'COMPLETED' || j.status === 'FAILED') this.poll?.unsubscribe();
      });
    });
  }

  jobBadge(s: string): string {
    return { COMPLETED: 'completed', RUNNING: 'running', QUEUED: 'pending', FAILED: 'error' }[s] ?? '';
  }
  jobIconClass(s: string): string {
    return { COMPLETED: 'completed', RUNNING: 'running', QUEUED: 'pending', FAILED: 'failed' }[s] ?? 'pending';
  }
  statusLabel(s: string): string {
    return { QUEUED: 'Queued', RUNNING: 'Building', COMPLETED: 'Ready', FAILED: 'Failed' }[s] ?? s;
  }
  downloadUrl(id: string): string { return this.api.exportDownloadUrl(id); }
}
