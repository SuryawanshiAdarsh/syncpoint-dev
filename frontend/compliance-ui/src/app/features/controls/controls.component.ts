import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '@core/api/api.service';
import { Control, ControlStatus } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiSearchComponent,
  UiToolbarComponent,
  UiFilterChipsComponent,
  UiControlStatusBadgeComponent,
  UiFilterChip,
} from '@ui';

@Component({
  standalone: true,
  selector: 'app-controls',
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatFormFieldModule, MatSelectModule, MatIconModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent,
    UiSearchComponent, UiToolbarComponent, UiFilterChipsComponent,
    UiControlStatusBadgeComponent,
  ],
  styles: [`
    .cat-cell {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 4px 12px;
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      white-space: normal;
      word-break: break-word;
      line-height: 1.3;
      min-width: 150px;
      max-width: 100%;
      text-align: center;
    }
    .data-table { table-layout: fixed; }
    .code { font-family: var(--font-mono); font-weight: var(--weight-medium); }
    .title-cell { cursor: pointer; }
    .desc-line {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      margin-top: 2px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .count-line {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      padding: 12px var(--space-6);
    }

    /* Quick-view modal */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(15, 23, 42, 0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
      padding: var(--space-4);
      animation: modalFadeIn 150ms ease-out;
    }
    .modal-card {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      max-width: 560px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      padding: var(--space-6);
    }
    .modal-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }
    .modal-code {
      display: block;
      font-size: var(--text-sm);
      color: var(--color-primary-text);
      margin-bottom: 4px;
    }
    .modal-title {
      font-size: 20px;
      font-weight: var(--weight-semibold);
      margin: 0;
      line-height: 1.3;
    }
    .modal-close {
      background: none; border: none; cursor: pointer;
      color: var(--color-text-muted);
      padding: 4px; border-radius: var(--radius-md);
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .modal-close:hover { background: var(--color-surface-muted); }
    .modal-meta { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap; }
    .modal-description {
      color: var(--color-text-secondary);
      line-height: 1.6;
      font-size: var(--text-sm);
      white-space: pre-wrap;
    }
    .modal-actions { margin-top: var(--space-5); display: flex; justify-content: flex-end; }
    @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
  `],
  template: `
    <div class="page">
      <ui-page-header
        eyebrow="SOC 2 Framework"
        title="Controls"
        [subtitle]="c.controls.subtitle">
      </ui-page-header>

      <ui-toolbar>
        <ui-search leading
                   [value]="search()"
                   (valueChange)="search.set($event)"
                   placeholder="Search by code, title, category, or description…">
        </ui-search>
        <mat-form-field trailing appearance="outline" style="width: 180px;" subscriptSizing="dynamic">
          <mat-label>Category</mat-label>
          <mat-select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event)">
            <mat-option value="">All categories</mat-option>
            <mat-option *ngFor="let c of categories()" [value]="c">{{ c }}</mat-option>
          </mat-select>
        </mat-form-field>
      </ui-toolbar>

      <ui-filter-chips
        [chips]="statusChips()"
        [selected]="statusFilter()"
        (selectedChange)="setStatus($event)"
        style="margin-bottom: var(--space-4);">
      </ui-filter-chips>

      <ui-card padding="flush">
        <div class="count-line">
          Showing {{ filtered().length }} of {{ all().length }} controls
        </div>

        <table class="data-table" *ngIf="filtered().length; else emptyT">
          <colgroup>
            <col style="width: 9%;">
            <col style="width: 42%;">
            <col style="width: 29%;">
            <col style="width: 20%;">
          </colgroup>
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Category</th>
              <th style="text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of filtered()">
              <td>
                <a [routerLink]="['/controls', c.id]" class="code">{{ c.code }}</a>
              </td>
              <td class="title-cell" [title]="c.description" (click)="selectedControl.set(c)">
                <div style="font-weight: var(--weight-medium);">{{ c.title }}</div>
                <div class="desc-line">{{ c.description }}</div>
              </td>
              <td><span class="cat-cell" [title]="c.category">{{ c.category }}</span></td>
              <td style="text-align: right;">
                <ui-control-status-badge [status]="c.status"></ui-control-status-badge>
              </td>
            </tr>
          </tbody>
        </table>

        <ng-template #emptyT>
          <ui-empty-state
            icon="filter_alt_off"
            title="No controls match your filter"
            description="Try clearing the search or selecting a different status.">
          </ui-empty-state>
        </ng-template>
      </ui-card>
    </div>

    <div class="modal-backdrop" *ngIf="selectedControl() as sc" (click)="selectedControl.set(null)">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <span class="code modal-code">{{ sc.code }}</span>
            <h2 class="modal-title">{{ sc.title }}</h2>
          </div>
          <button class="modal-close" type="button" (click)="selectedControl.set(null)" aria-label="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="modal-meta">
          <span class="cat-cell">{{ sc.category }}</span>
          <ui-control-status-badge [status]="sc.status"></ui-control-status-badge>
        </div>
        <p class="modal-description">{{ sc.description }}</p>
        <div class="modal-actions">
          <a class="btn primary" [routerLink]="['/controls', sc.id]" (click)="selectedControl.set(null)">View mapped evidence →</a>
        </div>
      </div>
    </div>
  `,
})
export class ControlsComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  all = signal<Control[]>([]);
  search = signal('');
  statusFilter = signal<'' | ControlStatus>('');
  categoryFilter = signal('');
  selectedControl = signal<Control | null>(null);

  categories = computed(() =>
    Array.from(new Set(this.all().map(c => c.category))).sort()
  );

  statusChips = computed<UiFilterChip[]>(() => {
    const list = this.all();
    return [
      { key: '',             label: 'All',           count: list.length },
      { key: 'COVERED',      label: 'Covered',       count: list.filter(c => c.status === 'COVERED').length,      colorDot: '#10b981' },
      { key: 'PARTIAL',      label: 'Partial',       count: list.filter(c => c.status === 'PARTIAL').length,      colorDot: '#f59e0b' },
      { key: 'NEEDS_REVIEW', label: 'Needs review',  count: list.filter(c => c.status === 'NEEDS_REVIEW').length, colorDot: '#8b5cf6' },
      { key: 'MISSING',      label: 'Missing',       count: list.filter(c => c.status === 'MISSING').length,      colorDot: '#ef4444' },
    ];
  });

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const s = this.statusFilter();
    const cat = this.categoryFilter();
    return this.all().filter(c => {
      if (s && c.status !== s) return false;
      if (cat && c.category !== cat) return false;
      if (!q) return true;
      return c.code.toLowerCase().includes(q)
          || c.title.toLowerCase().includes(q)
          || c.category.toLowerCase().includes(q)
          || c.description.toLowerCase().includes(q);
    });
  });

  ngOnInit(): void {
    this.api.controls().subscribe(cs => this.all.set(cs));
  }

  setStatus(key: string): void {
    this.statusFilter.set(key as '' | ControlStatus);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.selectedControl.set(null);
  }
}
