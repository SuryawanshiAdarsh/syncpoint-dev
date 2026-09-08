import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '@core/api/api.service';
import { Risk, RiskCategory, RiskLevel, RiskStatus, Me } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiToastComponent,
  UiButtonComponent,
  UiBadgeComponent,
} from '@ui';

const CATEGORIES: RiskCategory[] = ['FRAUD', 'OPERATIONAL', 'TECHNOLOGY', 'COMPLIANCE', 'THIRD_PARTY', 'FINANCIAL'];
const LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
const PAGE_SIZE = 10;

/** List-only view — clicking a row goes to risk-detail.component.ts for status/owner/control actions. */
@Component({
  standalone: true,
  selector: 'app-risk-register',
  imports: [
    CommonModule, RouterLink, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiToastComponent,
    UiButtonComponent, UiBadgeComponent,
  ],
  styles: [`
    .row { display: flex; gap: var(--space-3); align-items: end; flex-wrap: wrap; }
    .row + .row { margin-top: var(--space-4); }
    .full-row mat-form-field { flex: 1 1 100%; }

    .data-table { width: 100%; table-layout: fixed; }
    .data-row { cursor: pointer; }
    .title-cell .name { font-weight: 600; }
    .title-cell .desc { color: var(--color-text-muted); font-size: 12.5px; margin-top: 2px; }
    .muted-cell { color: var(--color-text-muted); font-size: 13px; }
    .toast-wrap { margin-top: var(--space-4); }
    .pager {
      display: flex; align-items: center; justify-content: center; gap: 14px;
      padding: 14px var(--space-6);
      border-top: 1px solid var(--color-divider);
    }
  `],
  template: `
    <div class="page">
      <ui-page-header
        [eyebrow]="c.riskRegister.eyebrow"
        [title]="c.riskRegister.title"
        [subtitle]="c.riskRegister.subtitle">
      </ui-page-header>

      <ui-card *ngIf="canManage()" [title]="c.riskRegister.createCardTitle"
               [caption]="c.riskRegister.createCardCaption" style="display:block;margin-top:var(--space-4);">
        <div class="row full-row">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>{{ c.riskRegister.titleLabel }}</mat-label>
            <input matInput [(ngModel)]="formTitle" [placeholder]="c.riskRegister.titlePlaceholder">
          </mat-form-field>
        </div>
        <div class="row full-row">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>{{ c.riskRegister.descriptionLabel }}</mat-label>
            <textarea matInput rows="2" [(ngModel)]="formDescription"></textarea>
          </mat-form-field>
        </div>
        <div class="row">
          <mat-form-field appearance="outline" style="width:190px;" subscriptSizing="dynamic">
            <mat-label>{{ c.riskRegister.categoryLabel }}</mat-label>
            <mat-select [(ngModel)]="formCategory">
              <mat-option *ngFor="let cat of categories" [value]="cat">{{ categoryLabel(cat) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:150px;" subscriptSizing="dynamic">
            <mat-label>{{ c.riskRegister.likelihoodLabel }}</mat-label>
            <mat-select [(ngModel)]="formLikelihood">
              <mat-option *ngFor="let lvl of levels" [value]="lvl">{{ levelLabel(lvl) }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:150px;" subscriptSizing="dynamic">
            <mat-label>{{ c.riskRegister.impactLabel }}</mat-label>
            <mat-select [(ngModel)]="formImpact">
              <mat-option *ngFor="let lvl of levels" [value]="lvl">{{ levelLabel(lvl) }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="row" style="margin-top:var(--space-2);">
          <ui-button variant="primary" [loading]="saving()" [loadingText]="c.riskRegister.savingButton" [disabled]="!formTitle.trim()" (click)="save()">
            {{ c.riskRegister.addButton }}
          </ui-button>
        </div>
        <ui-toast *ngIf="formError()" variant="error" class="toast-wrap">{{ formError() }}</ui-toast>
      </ui-card>

      <ui-toast *ngIf="msg()" variant="success" class="toast-wrap">{{ msg() }}</ui-toast>

      <ui-card padding="flush" style="display:block;margin-top:var(--space-4);">
        <table class="data-table" *ngIf="paged().length; else emptyState">
          <colgroup>
            <col style="width: 46%"><col style="width: 20%"><col style="width: 12%"><col style="width: 22%">
          </colgroup>
          <thead>
            <tr>
              <th>{{ c.riskRegister.tableTitle }}</th>
              <th>{{ c.riskRegister.tableCategory }}</th>
              <th>{{ c.riskRegister.tableScore }}</th>
              <th>{{ c.riskRegister.tableStatus }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of paged()" class="data-row" [routerLink]="['/risk-register', r.id]">
              <td class="title-cell">
                <div class="name">{{ r.title }}</div>
                <div class="desc" *ngIf="r.description">{{ r.description }}</div>
              </td>
              <td>{{ categoryLabel(r.category) }}</td>
              <td><ui-badge [variant]="scoreVariant(r.score)">{{ r.score }}</ui-badge></td>
              <td><ui-badge [variant]="statusVariant(r.status)">{{ statusLabel(r.status) }}</ui-badge></td>
            </tr>
          </tbody>
        </table>
        <ng-template #emptyState>
          <ui-empty-state icon="report_problem" [title]="c.riskRegister.emptyTitle" [description]="c.riskRegister.emptyMessage"></ui-empty-state>
        </ng-template>

        <div class="pager" *ngIf="risks().length">
          <button class="btn ghost sm" (click)="prevPage()" [disabled]="page() === 0">{{ c.riskRegister.pagePrev }}</button>
          <span class="muted small">{{ c.riskRegister.pageIndicator(page() + 1, totalPages()) }}</span>
          <button class="btn ghost sm" (click)="nextPage()" [disabled]="page() >= totalPages() - 1">{{ c.riskRegister.pageNext }}</button>
        </div>
      </ui-card>
    </div>
  `,
})
export class RiskRegisterComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  readonly categories = CATEGORIES;
  readonly levels = LEVELS;
  readonly pageSize = PAGE_SIZE;

  me = signal<Me | null>(null);
  risks = signal<Risk[]>([]);
  page = signal(0);

  saving = signal(false);
  formError = signal<string | null>(null);
  msg = signal<string | null>(null);

  formTitle = '';
  formDescription = '';
  formCategory: RiskCategory = 'OPERATIONAL';
  formLikelihood: RiskLevel = 'MEDIUM';
  formImpact: RiskLevel = 'MEDIUM';

  canManage = computed(() => {
    const r = this.me()?.role;
    return r === 'OWNER' || r === 'ADMIN' || r === 'REVIEWER';
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.risks().length / this.pageSize)));
  paged = computed(() => {
    const start = this.page() * this.pageSize;
    return this.risks().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.api.me().subscribe(m => this.me.set(m));
    this.reload();
  }

  private reload(): void {
    this.api.risks().subscribe(list => this.risks.set(list));
  }

  categoryLabel(cat: RiskCategory): string {
    return (this.c.riskRegister as any)['category' + this.toPascalCase(cat)] ?? cat;
  }
  levelLabel(lvl: RiskLevel): string {
    return (this.c.riskRegister as any)['level' + this.toPascalCase(lvl)] ?? lvl;
  }
  statusLabel(status: RiskStatus): string {
    return (this.c.riskRegister as any)['status' + this.toPascalCase(status)] ?? status;
  }
  private toPascalCase(s: string): string {
    return s.toLowerCase().replace(/(^|_)([a-z])/g, (_, __, ch) => ch.toUpperCase());
  }

  scoreVariant(score: number): 'error' | 'warning' | 'neutral' {
    if (score >= 6) return 'error';
    if (score >= 3) return 'warning';
    return 'neutral';
  }

  statusVariant(status: RiskStatus): 'info' | 'warning' | 'success' | 'neutral' {
    if (status === 'IDENTIFIED') return 'info';
    if (status === 'MITIGATING') return 'warning';
    if (status === 'MITIGATED') return 'success';
    return 'neutral';
  }

  save(): void {
    if (!this.formTitle.trim()) return;
    this.saving.set(true);
    this.formError.set(null);
    this.api.createRisk({
      title: this.formTitle.trim(),
      description: this.formDescription.trim() || undefined,
      category: this.formCategory,
      likelihood: this.formLikelihood,
      impact: this.formImpact,
      ownerUserId: null,
      nextReviewDate: null,
      controlIds: [],
    }).subscribe({
      next: () => {
        this.msg.set(this.c.riskRegister.createdToast);
        this.formTitle = '';
        this.formDescription = '';
        this.formCategory = 'OPERATIONAL';
        this.formLikelihood = 'MEDIUM';
        this.formImpact = 'MEDIUM';
        this.page.set(0);
        this.reload();
      },
      error: (e) => this.formError.set(e?.error?.message ?? this.c.riskRegister.actionError),
      complete: () => this.saving.set(false),
    });
  }

  prevPage(): void { this.page.update(p => Math.max(0, p - 1)); }
  nextPage(): void { this.page.update(p => Math.min(this.totalPages() - 1, p + 1)); }
}
