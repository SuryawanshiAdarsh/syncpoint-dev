import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '@core/api/api.service';
import { Risk } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import { UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiBadgeComponent, UiButtonComponent } from '@ui';

/** Read-only view of the organization's CC3 risk register for the invited-auditor workspace. */
@Component({
  standalone: true,
  selector: 'app-auditor-risk-register',
  imports: [CommonModule, UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiBadgeComponent, UiButtonComponent],
  styles: [`
    .data-table { width: 100%; table-layout: fixed; }
    .title-cell .desc { color: var(--color-text-muted); font-size: 12.5px; margin-top: 2px; }
  `],
  template: `
    <div class="page">
      <ui-page-header [eyebrow]="c.auditorWorkspace.eyebrow" [title]="c.auditorWorkspace.riskRegisterTitle"
                       [subtitle]="c.auditorWorkspace.riskRegisterSubtitle">
        <ui-button variant="ghost" [loading]="downloadingReport()" [loadingText]="c.auditorWorkspace.downloadingButton" (click)="downloadReport()">
          {{ c.auditorWorkspace.downloadReportButton }}
        </ui-button>
      </ui-page-header>

      <ui-card padding="flush" style="display:block;margin-top:var(--space-4);">
        <table class="data-table" *ngIf="risks().length; else emptyState">
          <colgroup><col style="width:44%"><col style="width:20%"><col style="width:12%"><col style="width:24%"></colgroup>
          <thead><tr>
            <th>{{ c.auditorWorkspace.tableTitle }}</th>
            <th>{{ c.auditorWorkspace.tableCategory }}</th>
            <th>{{ c.auditorWorkspace.tableScore }}</th>
            <th>{{ c.auditorWorkspace.tableStatus }}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let r of risks()">
              <td class="title-cell">
                <div>{{ r.title }}</div>
                <div class="desc">{{ r.description }}</div>
              </td>
              <td>{{ r.category }}</td>
              <td>{{ r.score }}</td>
              <td><ui-badge variant="info">{{ r.status }}</ui-badge></td>
            </tr>
          </tbody>
        </table>
        <ng-template #emptyState>
          <ui-empty-state icon="report_problem" title="No risks recorded" description=""></ui-empty-state>
        </ng-template>
      </ui-card>
    </div>
  `,
})
export class AuditorRiskRegisterComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  risks = signal<Risk[]>([]);
  downloadingReport = signal(false);

  ngOnInit(): void {
    this.api.auditorRiskRegister().subscribe(list => this.risks.set(list));
  }

  downloadReport(): void {
    this.downloadingReport.set(true);
    this.api.auditorRiskAssessmentReportBlob().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'soc2-risk-assessment.txt';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      complete: () => this.downloadingReport.set(false),
    });
  }
}
