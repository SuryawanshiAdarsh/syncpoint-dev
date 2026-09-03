import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { ApiService } from '../../core/api/api.service';
import { AuditEvent } from '../../core/api/api.types';
import { CAPTIONS } from '@captions';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiToolbarComponent,
  UiSearchComponent,
  UiFilterChipsComponent,
  UiBadgeComponent,
  UiBadgeVariant,
  UiFilterChip,
} from '@ui';

type EventCategory = 'AUTH' | 'EVIDENCE' | 'MAPPING' | 'INTEGRATION' | 'OTHER';

const CATEGORY_BY_EVENT: Record<string, EventCategory> = {
  LOGIN: 'AUTH', LOGOUT: 'AUTH', USER_CREATED: 'AUTH', USER_ROLE_CHANGED: 'AUTH', ONBOARDING_COMPLETED: 'AUTH',
  EVIDENCE_CREATED: 'EVIDENCE', EVIDENCE_REVIEWED: 'EVIDENCE', EVIDENCE_MAPPED: 'EVIDENCE',
  EVIDENCE_RENEWED: 'EVIDENCE', AI_ANALYSIS_CREATED: 'EVIDENCE',
  MAPPING_CONFIRMED: 'MAPPING', MAPPING_REJECTED: 'MAPPING',
  INTEGRATION_CREATED: 'INTEGRATION', INTEGRATION_CONNECTED: 'INTEGRATION', INTEGRATION_TESTED: 'INTEGRATION',
  INTEGRATION_DISCONNECTED: 'INTEGRATION', INTEGRATION_SCHEDULE_UPDATED: 'INTEGRATION',
  COLLECTION_STARTED: 'INTEGRATION', COLLECTION_COMPLETED: 'INTEGRATION', COLLECTION_FAILED: 'INTEGRATION',
};

const VARIANT_BY_EVENT: Record<string, UiBadgeVariant> = {
  MAPPING_REJECTED: 'rejected', COLLECTION_FAILED: 'failed', INTEGRATION_DISCONNECTED: 'disconnected',
  MAPPING_CONFIRMED: 'approved', EVIDENCE_REVIEWED: 'approved', COLLECTION_COMPLETED: 'completed',
  ONBOARDING_COMPLETED: 'approved',
};

@Component({
  standalone: true,
  selector: 'app-audit-log',
  imports: [
    CommonModule, FormsModule, MatIconModule, MatFormFieldModule, MatSelectModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiToolbarComponent,
    UiSearchComponent, UiFilterChipsComponent, UiBadgeComponent,
  ],
  styles: [`
    .count-line { color: var(--color-text-muted); font-size: var(--text-sm); padding: 12px var(--space-6); }
    .entity-cell { font-family: var(--font-mono); font-size: 12px; color: var(--color-text-secondary); }
    .expand-row td { background: var(--color-surface-muted); padding: 0 !important; }
    .details-cell { padding: var(--space-4) 24px; font-size: var(--text-sm); }
    .details-cell dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; margin: 0; }
    .details-cell dt { color: var(--color-text-muted); }
    .details-cell dd { margin: 0; }
    .row-clickable { cursor: pointer; }
    .pager {
      display: flex; align-items: center; justify-content: center; gap: 14px;
      padding: 14px var(--space-6);
      border-top: 1px solid var(--color-divider);
    }
  `],
  template: `
    <div class="page">
      <ui-page-header [eyebrow]="c.auditLog.eyebrow" [title]="c.auditLog.title" [subtitle]="c.auditLog.subtitle"></ui-page-header>

      <ui-toolbar>
        <ui-search leading [value]="search()" (valueChange)="onSearchChange($event)" [placeholder]="c.auditLog.searchPlaceholder"></ui-search>
        <mat-form-field trailing appearance="outline" style="width:190px;" subscriptSizing="dynamic">
          <mat-label>{{ c.auditLog.filterActor }}</mat-label>
          <mat-select [ngModel]="actorFilter()" (ngModelChange)="onActorChange($event)">
            <mat-option value="">{{ c.auditLog.filterAllActors }}</mat-option>
            <mat-option *ngFor="let a of actors()" [value]="a.id">{{ a.label }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field trailing appearance="outline" style="width:200px;" subscriptSizing="dynamic">
          <mat-label>{{ c.auditLog.filterEventType }}</mat-label>
          <mat-select [ngModel]="eventTypeFilter()" (ngModelChange)="onEventTypeChange($event)">
            <mat-option value="">{{ c.auditLog.filterAllEventTypes }}</mat-option>
            <mat-option *ngFor="let t of eventTypes()" [value]="t">{{ t }}</mat-option>
          </mat-select>
        </mat-form-field>
      </ui-toolbar>

      <ui-filter-chips
        [chips]="categoryChips()"
        [selected]="categoryFilter()"
        (selectedChange)="onCategoryChange($event)"
        style="display:block;margin-bottom: var(--space-4);">
      </ui-filter-chips>

      <ui-card padding="flush">
        <div class="count-line">{{ c.auditLog.countLine(filtered().length, events().length) }}</div>

        <table class="data-table" *ngIf="paged().length; else empty">
          <thead><tr>
            <th style="padding-left:24px;">{{ c.auditLog.tableTime }}</th>
            <th>{{ c.auditLog.tableActor }}</th>
            <th>{{ c.auditLog.tableEvent }}</th>
            <th style="text-align:right;padding-right:24px;">{{ c.auditLog.tableEntity }}</th>
          </tr></thead>
          <tbody>
            <ng-container *ngFor="let e of paged()">
              <tr class="row-clickable" (click)="toggleExpand(e.id)">
                <td style="padding-left:24px;" class="muted small">{{ e.createdAt | date:'MMM d, h:mm:ss a' }}</td>
                <td>{{ e.actorName ?? c.auditLog.systemActor }}</td>
                <td><ui-badge [variant]="eventVariant(e.eventType)">{{ e.eventType }}</ui-badge></td>
                <td class="entity-cell" style="text-align:right;padding-right:24px;">
                  {{ e.entityType }}{{ e.entityId ? ' · ' + e.entityId.slice(0, 8) : '' }}
                </td>
              </tr>
              <tr class="expand-row" *ngIf="expandedId() === e.id">
                <td colspan="4">
                  <div class="details-cell">
                    <dl *ngIf="metadataKeys(e).length; else noDetails">
                      <ng-container *ngFor="let k of metadataKeys(e)">
                        <dt>{{ k }}</dt>
                        <dd>{{ e.metadata[k] }}</dd>
                      </ng-container>
                    </dl>
                    <ng-template #noDetails><span class="muted small">{{ c.auditLog.noDetails }}</span></ng-template>
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
          <ui-empty-state
            icon="fact_check"
            [title]="events().length ? c.auditLog.emptyFilterTitle : c.auditLog.emptyTitle"
            [description]="events().length ? c.auditLog.emptyFilterMessage : c.auditLog.emptyMessage">
          </ui-empty-state>
        </ng-template>
      </ui-card>
    </div>
  `,
})
export class AuditLogComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  readonly pageSize = 25;

  events = signal<AuditEvent[]>([]);
  search = signal('');
  actorFilter = signal('');
  eventTypeFilter = signal('');
  categoryFilter = signal('');
  page = signal(0);
  expandedId = signal<string | null>(null);

  actors = computed(() => {
    const seen = new Map<string, string>();
    for (const e of this.events()) {
      if (e.actorUserId && !seen.has(e.actorUserId)) {
        seen.set(e.actorUserId, e.actorName ?? e.actorUserId.slice(0, 8));
      }
    }
    return Array.from(seen, ([id, label]) => ({ id, label }));
  });

  eventTypes = computed(() => Array.from(new Set(this.events().map(e => e.eventType))).sort());

  categoryChips = computed<UiFilterChip[]>(() => {
    const list = this.events();
    const count = (cat: string) => cat === ''
      ? list.length
      : list.filter(e => (CATEGORY_BY_EVENT[e.eventType] ?? 'OTHER') === cat).length;
    return [
      { key: '', label: this.c.auditLog.chipAll, count: count('') },
      { key: 'AUTH', label: this.c.auditLog.chipAuth, count: count('AUTH'), colorDot: '#6366f1' },
      { key: 'EVIDENCE', label: this.c.auditLog.chipEvidence, count: count('EVIDENCE'), colorDot: '#0ea5e9' },
      { key: 'MAPPING', label: this.c.auditLog.chipMapping, count: count('MAPPING'), colorDot: '#8b5cf6' },
      { key: 'INTEGRATION', label: this.c.auditLog.chipIntegration, count: count('INTEGRATION'), colorDot: '#f59e0b' },
      { key: 'OTHER', label: this.c.auditLog.chipOther, count: count('OTHER'), colorDot: '#64748b' },
    ];
  });

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const actor = this.actorFilter();
    const eventType = this.eventTypeFilter();
    const category = this.categoryFilter();
    return this.events().filter(e => {
      if (actor && e.actorUserId !== actor) return false;
      if (eventType && e.eventType !== eventType) return false;
      if (category && (CATEGORY_BY_EVENT[e.eventType] ?? 'OTHER') !== category) return false;
      if (q && !e.eventType.toLowerCase().includes(q) && !(e.entityType ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  paged = computed(() => {
    const start = this.page() * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.api.auditEvents().subscribe(list => this.events.set(list));
  }

  onSearchChange(v: string): void { this.search.set(v); this.page.set(0); }
  onActorChange(v: string): void { this.actorFilter.set(v); this.page.set(0); }
  onEventTypeChange(v: string): void { this.eventTypeFilter.set(v); this.page.set(0); }
  onCategoryChange(v: string): void { this.categoryFilter.set(v); this.page.set(0); }
  prevPage(): void { this.page.update(p => Math.max(0, p - 1)); }
  nextPage(): void { this.page.update(p => Math.min(this.totalPages() - 1, p + 1)); }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  metadataKeys(e: AuditEvent): string[] {
    return e.metadata ? Object.keys(e.metadata) : [];
  }

  eventVariant(eventType: string): UiBadgeVariant {
    return VARIANT_BY_EVENT[eventType] ?? 'neutral';
  }
}
