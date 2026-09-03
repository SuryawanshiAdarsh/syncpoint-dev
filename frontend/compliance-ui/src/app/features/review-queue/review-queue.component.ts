import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '../../core/api/api.service';
import { Evidence } from '../../core/api/api.types';
import { CAPTIONS } from '@captions';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiEvidenceStatusBadgeComponent,
  UiFreshnessBadgeComponent,
  UiSourcePillComponent,
} from '@ui';

/** Ordered by severity: lower number surfaces first in the queue. */
type QueueReason = 'EXPIRED' | 'UNMAPPED' | 'EXPIRING' | 'LOW_CONFIDENCE';
const REASON_RANK: Record<QueueReason, number> = {
  EXPIRED: 0, UNMAPPED: 1, EXPIRING: 2, LOW_CONFIDENCE: 3,
};
const LOW_CONFIDENCE_THRESHOLD = 0.7;

interface QueueItem {
  evidence: Evidence;
  reason: QueueReason;
}

@Component({
  standalone: true,
  selector: 'app-review-queue',
  imports: [
    CommonModule, RouterLink, MatIconModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent,
    UiEvidenceStatusBadgeComponent, UiFreshnessBadgeComponent, UiSourcePillComponent,
  ],
  styles: [`
    .count-line {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      padding: 12px var(--space-6);
    }
    .name-cell { max-width: 320px; }
    .name-cell .name {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .name-cell .sub { color: var(--color-text-muted); font-size: 12px; margin-top: 2px; }
    .reason-chip {
      display: inline-flex; align-items: flex-start; gap: 6px;
      padding: 3px 10px;
      border-radius: var(--radius-md);
      font-size: 12px; font-weight: 500;
      line-height: 1.4;
      background: var(--color-warning-soft, #fef3c7);
      color: var(--color-warning-text, #92400e);
      border: 1px solid var(--color-warning-border, #fde68a);
      white-space: normal;
      max-width: 160px;
    }
    .reason-chip mat-icon { font-size: 14px; height: 14px; width: 14px; flex-shrink: 0; margin-top: 1px; }
    .pager {
      display: flex; align-items: center; justify-content: center; gap: 14px;
      padding: 14px var(--space-6);
      border-top: 1px solid var(--color-divider);
    }
    /* BUG-001: auto table layout let unshrinkable cells (the action button) paint
       past the card edge -- fix layout + width budget, scoped to this component only. */
    .table-scroll { overflow-x: auto; }
    .data-table { table-layout: fixed; }
    .icon-link {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; padding: 0; flex-shrink: 0;
    }
    .icon-link mat-icon { font-size: 16px; height: 16px; width: 16px; }
  `],
  template: `
    <div class="page">
      <ui-page-header
        [eyebrow]="c.reviewQueue.eyebrow"
        [title]="c.reviewQueue.title"
        [subtitle]="c.reviewQueue.subtitle">
      </ui-page-header>

      <ui-card padding="flush">
        <div class="count-line">{{ c.reviewQueue.countLine(paged().length, queue().length) }}</div>

        <div class="table-scroll" *ngIf="paged().length; else empty">
        <table class="data-table">
          <colgroup>
            <col style="width:32%"><col style="width:14%"><col style="width:12%">
            <col style="width:12%"><col style="width:18%"><col style="width:12%">
          </colgroup>
          <thead><tr>
            <th style="padding-left:24px;">{{ c.reviewQueue.tableName }}</th>
            <th>{{ c.reviewQueue.tableSource }}</th>
            <th>{{ c.reviewQueue.tableStatus }}</th>
            <th>{{ c.reviewQueue.tableFreshness }}</th>
            <th>{{ c.reviewQueue.tableReason }}</th>
            <th style="text-align:right;padding-right:24px;">{{ c.reviewQueue.tableActions }}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let item of paged()">
              <td class="name-cell" style="padding-left:24px;">
                <div class="name" [title]="item.evidence.name">{{ item.evidence.name }}</div>
                <div class="sub">{{ item.evidence.collectedAt | date:'MMM d, h:mm a' }}</div>
              </td>
              <td><ui-source-pill [source]="item.evidence.sourceType"></ui-source-pill></td>
              <td><ui-evidence-status-badge [status]="item.evidence.status"></ui-evidence-status-badge></td>
              <td><ui-freshness-badge [freshness]="item.evidence.freshness"></ui-freshness-badge></td>
              <td style="max-width:170px;">
                <span class="reason-chip">
                  <mat-icon>{{ reasonIcon(item.reason) }}</mat-icon>{{ reasonLabel(item.reason) }}
                </span>
              </td>
              <td style="text-align:right;padding-right:24px;">
                <a class="btn ghost sm icon-link" [routerLink]="['/evidence']" [queryParams]="{ highlight: item.evidence.id }"
                   [attr.aria-label]="c.reviewQueue.goToEvidence" [title]="c.reviewQueue.goToEvidence">
                  <mat-icon>open_in_new</mat-icon>
                </a>
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        <div class="pager" *ngIf="queue().length">
          <button class="btn ghost sm" (click)="prevPage()" [disabled]="page() === 0">{{ c.reviewQueue.pagePrev }}</button>
          <span class="muted small">{{ c.reviewQueue.pageIndicator(page() + 1, totalPages()) }}</span>
          <button class="btn ghost sm" (click)="nextPage()" [disabled]="page() >= totalPages() - 1">{{ c.reviewQueue.pageNext }}</button>
        </div>

        <ng-template #empty>
          <ui-empty-state
            icon="task_alt"
            [title]="c.reviewQueue.emptyTitle"
            [description]="c.reviewQueue.emptyMessage">
          </ui-empty-state>
        </ng-template>
      </ui-card>
    </div>
  `,
})
export class ReviewQueueComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  readonly pageSize = 25;

  items = signal<Evidence[]>([]);
  page = signal(0);

  queue = computed<QueueItem[]>(() => {
    const result: QueueItem[] = [];
    for (const e of this.items()) {
      if (e.status === 'REJECTED') continue;
      const reason = this.reasonFor(e);
      if (reason) result.push({ evidence: e, reason });
    }
    return result.sort((a, b) => {
      const byReason = REASON_RANK[a.reason] - REASON_RANK[b.reason];
      if (byReason !== 0) return byReason;
      return new Date(b.evidence.collectedAt).getTime() - new Date(a.evidence.collectedAt).getTime();
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.queue().length / this.pageSize)));

  paged = computed(() => {
    const start = this.page() * this.pageSize;
    return this.queue().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.api.evidence().subscribe(list => this.items.set(list));
  }

  prevPage(): void { this.page.update(p => Math.max(0, p - 1)); }
  nextPage(): void { this.page.update(p => Math.min(this.totalPages() - 1, p + 1)); }


  private reasonFor(e: Evidence): QueueReason | null {
    if (e.freshness === 'EXPIRED') return 'EXPIRED';
    if (!e.mapped) return 'UNMAPPED';
    if (e.freshness === 'EXPIRING') return 'EXPIRING';
    if (e.status !== 'APPROVED' && e.lowestConfidence != null && e.lowestConfidence < LOW_CONFIDENCE_THRESHOLD) {
      return 'LOW_CONFIDENCE';
    }
    return null;
  }

  reasonLabel(r: QueueReason): string {
    return ({
      EXPIRED: this.c.reviewQueue.reasonExpired,
      UNMAPPED: this.c.reviewQueue.reasonUnmapped,
      EXPIRING: this.c.reviewQueue.reasonExpiring,
      LOW_CONFIDENCE: this.c.reviewQueue.reasonLowConfidence,
    } as const)[r];
  }

  reasonIcon(r: QueueReason): string {
    return ({
      EXPIRED: 'event_busy',
      UNMAPPED: 'link_off',
      EXPIRING: 'schedule',
      LOW_CONFIDENCE: 'help_outline',
    } as const)[r];
  }
}
