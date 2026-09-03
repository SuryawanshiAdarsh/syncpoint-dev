import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '../../core/api/api.service';
import { CollectionRun, CollectionItem, CollectionRunStatus, CollectionTrigger, Integration } from '../../core/api/api.types';
import { CAPTIONS } from '@captions';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiToolbarComponent,
  UiFilterChipsComponent,
  UiBadgeComponent,
  UiBadgeVariant,
  UiFilterChip,
} from '@ui';

@Component({
  standalone: true,
  selector: 'app-activity',
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatIconModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent,
    UiToolbarComponent, UiFilterChipsComponent, UiBadgeComponent,
  ],
  styles: [`
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    .kpi {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
    }
    .kpi .label { color: var(--color-text-muted); font-size: var(--text-sm); }
    .kpi .val { font-size: 26px; font-weight: 600; margin-top: 4px; letter-spacing: -0.02em; }

    .count-line {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      padding: 12px var(--space-6);
    }
    .items-cell { display: flex; align-items: center; gap: 6px; font-size: var(--text-sm); }
    .items-cell .ok { color: var(--color-success-text); }
    .items-cell .failed { color: var(--color-danger-text); }
    .expand-row td { background: var(--color-surface-muted); padding: 0 !important; }
    .log-trail { padding: var(--space-4) 24px; }
    .log-trail table { width: 100%; }
    .log-trail th { text-align: left; font-size: 11px; color: var(--color-text-muted); text-transform: uppercase; padding-bottom: 6px; }
    .log-trail td { padding: 4px 0; font-size: var(--text-sm); vertical-align: top; }
    .row-clickable { cursor: pointer; }
    .pager {
      display: flex; align-items: center; justify-content: center; gap: 14px;
      padding: 14px var(--space-6);
      border-top: 1px solid var(--color-divider);
    }
  `],
  template: `
    <div class="page">
      <ui-page-header [eyebrow]="c.activity.eyebrow" [title]="c.activity.title" [subtitle]="c.activity.subtitle"></ui-page-header>

      <div class="kpi-grid">
        <div class="kpi"><div class="label">{{ c.activity.kpiSuccessRate }}</div><div class="val">{{ successRatePct() }}%</div></div>
        <div class="kpi"><div class="label">{{ c.activity.kpiAvgDuration }}</div><div class="val">{{ avgDurationLabel() }}</div></div>
        <div class="kpi"><div class="label">{{ c.activity.kpiTotalRuns }}</div><div class="val">{{ runs().length }}</div></div>
        <div class="kpi"><div class="label">{{ c.activity.kpiItemsCollected }}</div><div class="val">{{ totalItemsOk() }}</div></div>
      </div>

      <ui-toolbar>
        <mat-form-field trailing appearance="outline" style="width:200px;" subscriptSizing="dynamic">
          <mat-label>{{ c.activity.filterIntegration }}</mat-label>
          <mat-select [ngModel]="integrationFilter()" (ngModelChange)="onIntegrationChange($event)">
            <mat-option value="">{{ c.activity.filterAllIntegrations }}</mat-option>
            <mat-option *ngFor="let i of integrations()" [value]="i.id">{{ i.displayName ?? i.provider }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field trailing appearance="outline" style="width:170px;" subscriptSizing="dynamic">
          <mat-label>{{ c.activity.filterTrigger }}</mat-label>
          <mat-select [ngModel]="triggerFilter()" (ngModelChange)="onTriggerChange($event)">
            <mat-option value="">{{ c.activity.filterAllTriggers }}</mat-option>
            <mat-option value="MANUAL">{{ c.activity.triggerManual }}</mat-option>
            <mat-option value="SCHEDULED">{{ c.activity.triggerScheduled }}</mat-option>
          </mat-select>
        </mat-form-field>
      </ui-toolbar>

      <ui-filter-chips
        [chips]="statusChips()"
        [selected]="statusFilter()"
        (selectedChange)="onStatusChipChange($event)"
        style="display:block;margin-bottom: var(--space-4);">
      </ui-filter-chips>

      <ui-card padding="flush">
        <div class="count-line">{{ filtered().length }} of {{ runs().length }} runs</div>

        <table class="data-table" *ngIf="paged().length; else empty">
          <thead><tr>
            <th style="padding-left:24px;">{{ c.activity.tableIntegration }}</th>
            <th>{{ c.activity.tableTrigger }}</th>
            <th>{{ c.activity.tableStatus }}</th>
            <th>{{ c.activity.tableStarted }}</th>
            <th>{{ c.activity.tableDuration }}</th>
            <th style="text-align:right;padding-right:24px;">{{ c.activity.tableItems }}</th>
          </tr></thead>
          <tbody>
            <ng-container *ngFor="let r of paged()">
              <tr class="row-clickable" (click)="toggleExpand(r.id)">
                <td style="padding-left:24px;">{{ integrationLabel(r.integrationId) }}</td>
                <td><ui-badge variant="neutral">{{ triggerLabel(r.trigger) }}</ui-badge></td>
                <td><ui-badge [variant]="statusVariant(r.status)">{{ statusLabel(r.status) }}</ui-badge></td>
                <td class="muted small">{{ (r.startedAt ?? r.createdAt) | date:'MMM d, h:mm a' }}</td>
                <td class="muted small">{{ durationLabel(r.durationMs) }}</td>
                <td style="text-align:right;padding-right:24px;">
                  <span class="items-cell" style="justify-content:flex-end;">
                    <span class="ok" *ngIf="r.itemsOk">✓ {{ r.itemsOk }}</span>
                    <span class="failed" *ngIf="r.itemsFailed">✗ {{ r.itemsFailed }}</span>
                    <span class="muted" *ngIf="!r.itemsTotal">—</span>
                  </span>
                </td>
              </tr>
              <tr class="expand-row" *ngIf="expandedRunId() === r.id">
                <td colspan="6">
                  <div class="log-trail">
                    <div class="muted small" style="margin-bottom:8px;">{{ c.activity.logTrailTitle }}</div>
                    <table *ngIf="expandedItems().length; else emptyLog">
                      <thead><tr>
                        <th>{{ c.activity.logEvidenceType }}</th>
                        <th>{{ c.activity.logStatus }}</th>
                        <th>{{ c.activity.logMessage }}</th>
                      </tr></thead>
                      <tbody>
                        <tr *ngFor="let item of expandedItems()">
                          <td>{{ item.evidenceType }}</td>
                          <td><ui-badge [variant]="itemStatusVariant(item.status)" size="sm">{{ item.status }}</ui-badge></td>
                          <td class="muted">{{ item.message ?? '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <ng-template #emptyLog><p class="muted small">{{ c.activity.logEmptyMessage }}</p></ng-template>
                    <p class="muted small" *ngIf="r.errorMessage" style="margin-top:8px;color:var(--color-danger-text);">{{ r.errorMessage }}</p>
                  </div>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>

        <div class="pager" *ngIf="filtered().length">
          <button class="btn ghost sm" (click)="prevPage()" [disabled]="page() === 0">Previous</button>
          <span class="muted small">Page {{ page() + 1 }} of {{ totalPages() }}</span>
          <button class="btn ghost sm" (click)="nextPage()" [disabled]="page() >= totalPages() - 1">Next</button>
        </div>

        <ng-template #empty>
          <ui-empty-state icon="history" [title]="c.activity.emptyTitle" [description]="c.activity.emptyMessage"></ui-empty-state>
        </ng-template>
      </ui-card>
    </div>
  `,
})
export class ActivityComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  readonly pageSize = 20;

  runs = signal<CollectionRun[]>([]);
  integrations = signal<Integration[]>([]);
  integrationFilter = signal('');
  triggerFilter = signal<'' | CollectionTrigger>('');
  statusFilter = signal('');
  page = signal(0);

  expandedRunId = signal<string | null>(null);
  expandedItems = signal<CollectionItem[]>([]);

  statusChips = computed<UiFilterChip[]>(() => {
    const list = this.runs();
    const count = (s: CollectionRunStatus) => list.filter(r => r.status === s).length;
    return [
      { key: '', label: this.c.activity.chipAll, count: list.length },
      { key: 'COMPLETED', label: this.c.activity.chipCompleted, count: count('COMPLETED'), colorDot: '#10b981' },
      { key: 'PARTIAL', label: this.c.activity.chipPartial, count: count('PARTIAL'), colorDot: '#f59e0b' },
      { key: 'FAILED', label: this.c.activity.chipFailed, count: count('FAILED'), colorDot: '#ef4444' },
      { key: 'RUNNING', label: this.c.activity.chipRunning, count: count('RUNNING') + count('QUEUED'), colorDot: '#6366f1' },
    ];
  });

  filtered = computed(() => {
    const integrationId = this.integrationFilter();
    const trigger = this.triggerFilter();
    const status = this.statusFilter();
    return this.runs().filter(r => {
      if (integrationId && r.integrationId !== integrationId) return false;
      if (trigger && r.trigger !== trigger) return false;
      if (status === 'RUNNING' && !(r.status === 'RUNNING' || r.status === 'QUEUED')) return false;
      if (status && status !== 'RUNNING' && r.status !== status) return false;
      return true;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  paged = computed(() => {
    const start = this.page() * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  successRatePct = computed(() => {
    const finished = this.runs().filter(r => r.status === 'COMPLETED' || r.status === 'PARTIAL' || r.status === 'FAILED');
    if (!finished.length) return 0;
    const ok = finished.filter(r => r.status === 'COMPLETED').length;
    return Math.round((ok / finished.length) * 100);
  });

  avgDurationLabel = computed(() => {
    const durations = this.runs().map(r => r.durationMs).filter((d): d is number => d != null);
    if (!durations.length) return this.c.activity.durationUnknown;
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return this.durationLabel(avg);
  });

  totalItemsOk = computed(() => this.runs().reduce((sum, r) => sum + r.itemsOk, 0));

  ngOnInit(): void {
    this.api.collectionRuns().subscribe(list => this.runs.set(list));
    this.api.integrations().subscribe(list => this.integrations.set(list));
  }

  onIntegrationChange(v: string): void { this.integrationFilter.set(v); this.page.set(0); }
  onTriggerChange(v: '' | CollectionTrigger): void { this.triggerFilter.set(v); this.page.set(0); }
  onStatusChipChange(v: string): void { this.statusFilter.set(v); this.page.set(0); }
  prevPage(): void { this.page.update(p => Math.max(0, p - 1)); }
  nextPage(): void { this.page.update(p => Math.min(this.totalPages() - 1, p + 1)); }

  toggleExpand(runId: string): void {
    if (this.expandedRunId() === runId) {
      this.expandedRunId.set(null);
      this.expandedItems.set([]);
      return;
    }
    this.expandedRunId.set(runId);
    this.api.collectionRun(runId).subscribe(detail => this.expandedItems.set(detail.items));
  }

  integrationLabel(integrationId: string): string {
    const i = this.integrations().find(x => x.id === integrationId);
    return i ? (i.displayName ?? i.provider) : integrationId.slice(0, 8);
  }

  triggerLabel(t: CollectionTrigger): string {
    return t === 'SCHEDULED' ? this.c.activity.triggerScheduled : this.c.activity.triggerManual;
  }

  statusLabel(s: CollectionRunStatus): string {
    return ({
      QUEUED: this.c.activity.statusQueued,
      RUNNING: this.c.activity.statusRunning,
      COMPLETED: this.c.activity.statusCompleted,
      PARTIAL: this.c.activity.statusPartial,
      FAILED: this.c.activity.statusFailed,
    } as const)[s];
  }

  statusVariant(s: CollectionRunStatus): UiBadgeVariant {
    return ({
      QUEUED: 'pending', RUNNING: 'running', COMPLETED: 'completed', PARTIAL: 'partial', FAILED: 'failed',
    } as const)[s];
  }

  itemStatusVariant(s: string): UiBadgeVariant {
    return ({ SUCCESS: 'approved', SKIPPED: 'neutral', FAILED: 'rejected' } as Record<string, UiBadgeVariant>)[s] ?? 'neutral';
  }

  durationLabel(ms?: number): string {
    if (ms == null) return this.c.activity.durationUnknown;
    if (ms < 1000) return `${Math.round(ms)}ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  }
}
