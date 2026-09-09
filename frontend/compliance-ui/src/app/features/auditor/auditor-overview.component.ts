import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ApiService } from '@core/api/api.service';
import { AuditorOverview } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import { UiPageHeaderComponent, UiCardComponent, UiButtonComponent } from '@ui';

/** Landing page of the invited-auditor workspace — engagement context + coverage snapshot, no write access. */
@Component({
  standalone: true,
  selector: 'app-auditor-overview',
  imports: [CommonModule, RouterLink, UiPageHeaderComponent, UiCardComponent, UiButtonComponent],
  styles: [`
    .kpi-row { display: flex; gap: var(--space-4); flex-wrap: wrap; margin-top: var(--space-4); }
    .kpi-card {
      flex: 1 1 180px; padding: var(--space-4);
      border: 1px solid var(--color-border); border-radius: var(--radius-lg);
      background: var(--color-surface);
    }
    .kpi-card .value { font-size: 26px; font-weight: var(--weight-semibold); }
    .kpi-card .label { color: var(--color-text-muted); font-size: var(--text-sm); margin-top: 4px; }
    .meta-row { display: flex; gap: var(--space-6); flex-wrap: wrap; margin-top: var(--space-4); }
    .meta-item .label { color: var(--color-text-muted); font-size: var(--text-sm); }
    .meta-item .value { font-weight: var(--weight-medium); margin-top: 2px; }
  `],
  template: `
    <div class="page">
      <ui-page-header [eyebrow]="c.auditorWorkspace.eyebrow" [title]="c.auditorWorkspace.overviewTitle"
                       [subtitle]="overview() ? c.auditorWorkspace.overviewSubtitle(overview()!.organizationName) : ''">
      </ui-page-header>

      <ui-card *ngIf="overview() as o">
        <div class="meta-row">
          <div class="meta-item">
            <div class="label">{{ c.auditorWorkspace.reportTypeLabel }}</div>
            <div class="value">{{ o.reportType === 'TYPE_II' ? 'Type II' : 'Type I' }}</div>
          </div>
          <div class="meta-item" *ngIf="o.reportType === 'TYPE_II'">
            <div class="label">{{ c.auditorWorkspace.observationPeriodLabel }}</div>
            <div class="value">{{ o.observationPeriodStart | date:'MMM d, y' }} \u2013 {{ o.observationPeriodEnd | date:'MMM d, y' }}</div>
          </div>
          <div class="meta-item" *ngIf="o.targetReportDate">
            <div class="label">{{ c.auditorWorkspace.targetReportDateLabel }}</div>
            <div class="value">{{ o.targetReportDate | date:'MMM d, y' }}</div>
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div class="value">{{ o.coveragePercent }}%</div>
            <div class="label">{{ c.auditorWorkspace.coverageLabel }} ({{ o.coveredCount }}/{{ o.totalControls }})</div>
          </div>
          <div class="kpi-card">
            <div class="value">{{ o.openRequestCount }}</div>
            <div class="label">{{ c.auditorWorkspace.openRequestsLabel }}</div>
          </div>
        </div>

        <div class="row" style="margin-top:var(--space-5);">
          <ui-button variant="primary" [loading]="downloading()" [loadingText]="c.auditorWorkspace.downloadingButton" (click)="downloadReport()">
            {{ c.auditorWorkspace.downloadReportButton }}
          </ui-button>
          <ui-button variant="ghost" [routerLink]="['/auditor/controls']">{{ c.auditorWorkspace.navControls }}</ui-button>
          <ui-button variant="ghost" [routerLink]="['/auditor/risk-register']">{{ c.auditorWorkspace.navRiskRegister }}</ui-button>
          <ui-button variant="ghost" [routerLink]="['/auditor/policies']">{{ c.auditorWorkspace.navPolicies }}</ui-button>
          <ui-button variant="ghost" [routerLink]="['/auditor/exceptions']">{{ c.auditorWorkspace.navExceptions }}</ui-button>
        </div>
      </ui-card>
    </div>
  `,
})
export class AuditorOverviewComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  overview = signal<AuditorOverview | null>(null);
  downloading = signal(false);

  ngOnInit(): void {
    this.api.auditorOverview().subscribe(o => this.overview.set(o));
  }

  downloadReport(): void {
    this.downloading.set(true);
    this.api.auditorReadinessReportBlob().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'soc2-readiness-report.txt';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      complete: () => this.downloading.set(false),
    });
  }
}
