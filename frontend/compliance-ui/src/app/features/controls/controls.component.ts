import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { ApiService } from '@core/api/api.service';
import { Control, ControlStatus } from '@core/api/api.types';
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
    MatFormFieldModule, MatSelectModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent,
    UiSearchComponent, UiToolbarComponent, UiFilterChipsComponent,
    UiControlStatusBadgeComponent,
  ],
  styles: [`
    .cat-cell {
      display: inline-flex; align-items: center;
      padding: 2px 8px;
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }
    .code { font-family: var(--font-mono); font-weight: var(--weight-medium); }
    .desc-line {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      margin-top: 2px;
      max-width: 520px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .count-line {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      padding: 12px var(--space-6);
    }
  `],
  template: `
    <div class="page">
      <ui-page-header
        eyebrow="SOC 2 Framework"
        title="Controls"
        subtitle="15 demo controls across access, change management, security monitoring, and data protection. Click any control to see mapped evidence.">
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
              <td>
                <div style="font-weight: var(--weight-medium);">{{ c.title }}</div>
                <div class="desc-line">{{ c.description }}</div>
              </td>
              <td><span class="cat-cell">{{ c.category }}</span></td>
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
  `,
})
export class ControlsComponent implements OnInit {
  private readonly api = inject(ApiService);

  all = signal<Control[]>([]);
  search = signal('');
  statusFilter = signal<'' | ControlStatus>('');
  categoryFilter = signal('');

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
}
