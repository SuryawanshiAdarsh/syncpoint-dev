import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '@core/api/api.service';
import { Policy, Me, PolicyCoverage } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiSearchComponent,
  UiToolbarComponent,
  UiBadgeComponent,
} from '@ui';

interface TemplateEntry { name: string; file: string; }

const TEMPLATE_LIBRARY: TemplateEntry[] = [
  { name: 'Information Security Policy', file: 'information-security-policy.md' },
  { name: 'Access Control Policy', file: 'access-control-policy.md' },
  { name: 'Incident Response Policy', file: 'incident-response-policy.md' },
  { name: 'Change Management Policy', file: 'change-management-policy.md' },
  { name: 'Vendor & Third-Party Risk Management Policy', file: 'vendor-risk-management-policy.md' },
  { name: 'Data Retention & Disposal Policy', file: 'data-retention-disposal-policy.md' },
  { name: 'Business Continuity & Disaster Recovery Policy', file: 'business-continuity-dr-policy.md' },
  { name: 'Acceptable Use Policy', file: 'acceptable-use-policy.md' },
  { name: 'Risk Assessment Policy', file: 'risk-assessment-policy.md' },
  { name: 'HR Security Policy (Onboarding & Offboarding)', file: 'hr-security-policy.md' },
  { name: 'Asset Management Policy', file: 'asset-management-policy.md' },
  { name: 'Password & Cryptography Policy', file: 'password-cryptography-policy.md' },
];

@Component({
  standalone: true,
  selector: 'app-policies',
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatIconModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent,
    UiSearchComponent, UiToolbarComponent, UiBadgeComponent,
  ],
  styles: [`
    .dropzone {
      border: 2px dashed var(--color-border-strong);
      border-radius: var(--radius-lg);
      background: var(--color-surface-muted);
      padding: 20px;
      display: flex; align-items: center; gap: 16px;
      transition: all 120ms var(--ease-out);
      cursor: pointer;
    }
    .dropzone:hover { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .dropzone.has-file { border-color: var(--color-success); background: var(--color-success-soft); }
    .dropzone-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: var(--color-surface); color: var(--color-primary);
      display: grid; place-items: center; box-shadow: var(--shadow-sm); flex-shrink: 0;
    }
    .dropzone.has-file .dropzone-icon { color: var(--color-success-text); }
    .dropzone-text .title { font-weight: 600; font-size: 14px; }
    .dropzone-text .sub { color: var(--color-text-muted); font-size: 12px; margin-top: 2px; }

    .form-row { display: flex; gap: 12px; align-items: end; margin-top: 16px; flex-wrap: wrap; }
    .form-row mat-form-field { flex: 1 1 180px; }

    .data-table { table-layout: fixed; }
    .data-row { cursor: pointer; }
    .title-cell .name { font-weight: 600; }
    .title-cell .category { color: var(--color-text-muted); font-size: 12.5px; margin-top: 2px; }
    .ack-line { font-size: 13px; }
    .ack-line.full { color: var(--color-success-text); }
    .chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .chip {
      display: inline-flex; align-items: center;
      padding: 2px 8px; border-radius: var(--radius-full);
      background: var(--color-surface-muted); border: 1px solid var(--color-border);
      font-size: 12px; font-family: var(--font-mono);
      color: var(--color-text-secondary);
    }
    .muted-cell { color: var(--color-text-muted); font-size: 13px; }

    .toast {
      display: flex; align-items: center; gap: 10px; padding: 12px 16px;
      background: var(--color-success-soft); border: 1px solid var(--color-success-border);
      border-radius: var(--radius-md); color: var(--color-success-text); font-size: 13.5px; margin-top: 12px;
    }
    .toast.error { background: var(--color-danger-soft); border-color: var(--color-danger-border); color: var(--color-danger-text); }

    /* Template library */
    .template-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px;
    }
    .template-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      background: var(--color-surface-muted);
    }
    .template-item mat-icon { color: var(--color-text-muted); flex-shrink: 0; }
    .template-item .name { font-size: 13px; flex: 1; }
    .template-item a { color: var(--color-primary); font-size: 12.5px; text-decoration: none; font-weight: 600; }
    .template-item a:hover { text-decoration: underline; }

    .count-line { color: var(--color-text-muted); font-size: var(--text-sm); padding: 12px var(--space-6); }

    .coverage-summary { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
    .ring-wrap { display: grid; place-items: center; flex-shrink: 0; }
    .ring { position: relative; width: 140px; height: 140px; }
    .ring svg { transform: rotate(-90deg); }
    .ring .center { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    .ring .center .frac { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; color: var(--color-text); }
    .ring .center .frac .of { font-size: 15px; font-weight: 500; color: var(--color-text-muted); }
    .coverage-gap-title { color: var(--color-text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 7px; }
  `],
  template: `
    <div class="page">
      <ui-page-header
        [eyebrow]="c.policies.eyebrow"
        [title]="c.policies.title"
        [subtitle]="c.policies.subtitle">
      </ui-page-header>

      <ui-card [title]="c.policies.coverageTitle" [caption]="c.policies.coverageCaption" *ngIf="coverage() as cov">
        <div class="coverage-summary">
          <div class="ring-wrap">
            <div class="ring">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="58" stroke="var(--color-surface-muted)" stroke-width="12" fill="none"/>
                <circle cx="70" cy="70" r="58"
                        stroke="var(--color-primary)" stroke-width="12" fill="none"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="coverageRingDash(cov)"
                        style="transition: stroke-dasharray 800ms cubic-bezier(0.16, 1, 0.3, 1);"/>
              </svg>
              <div class="center">
                <div class="frac">{{ cov.coveredCount }}<span class="of"> / {{ cov.totalControls }}</span></div>
              </div>
            </div>
          </div>
          <div style="flex:1;">
            <div class="coverage-gap-title">{{ c.policies.coverageGapTitle }}</div>
            <div class="chips" *ngIf="cov.uncoveredControlCodes.length; else noGap">
              <span class="chip" *ngFor="let code of cov.uncoveredControlCodes">{{ code }}</span>
            </div>
            <ng-template #noGap><span class="muted-cell">{{ c.policies.coverageGapEmpty }}</span></ng-template>
          </div>
        </div>
      </ui-card>

      <ui-card *ngIf="canManage()" [title]="c.policies.createCardTitle" [caption]="c.policies.createCardCaption" style="display:block;margin-top:var(--space-4);">
        <label class="dropzone" [class.has-file]="!!file">
          <div class="dropzone-icon"><mat-icon>{{ file ? 'check_circle' : 'upload_file' }}</mat-icon></div>
          <div class="dropzone-text" style="flex:1;">
            <div class="title">{{ file ? file.name : 'Drop a document here or click to browse' }}</div>
            <div class="sub" *ngIf="!file">PDF, DOCX, TXT, CSV, or JSON. Max 50 MB.</div>
          </div>
          <input #f type="file" (change)="fileChanged(f.files)" hidden>
        </label>

        <div class="form-row">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>{{ c.policies.titleLabel }}</mat-label>
            <input matInput [(ngModel)]="title" [placeholder]="c.policies.titlePlaceholder">
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>{{ c.policies.categoryLabel }}</mat-label>
            <input matInput [(ngModel)]="category" [placeholder]="c.policies.categoryPlaceholder" [matAutocomplete]="categoryAuto">
            <mat-autocomplete #categoryAuto="matAutocomplete">
              <mat-option *ngFor="let cat of filteredCategories()" [value]="cat">{{ cat }}</mat-option>
            </mat-autocomplete>
          </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic" style="flex: 2 1 260px;">
            <mat-label>{{ c.policies.descriptionLabel }}</mat-label>
            <input matInput [(ngModel)]="description">
          </mat-form-field>
          <button class="btn primary" (click)="publish()" [disabled]="!file || !title || !category || publishing()">
            <mat-icon>{{ publishing() ? 'hourglass_top' : 'gavel' }}</mat-icon>
            {{ publishing() ? c.policies.publishingButton : c.policies.publishButton }}
          </button>
        </div>

        <div *ngIf="publishError()" class="toast error"><mat-icon>error_outline</mat-icon>{{ publishError() }}</div>
      </ui-card>

      <ui-toolbar style="display:block;margin-top: var(--space-6);">
        <ui-search leading [value]="search()" (valueChange)="search.set($event)" placeholder="Search policies…"></ui-search>
        <button trailing class="btn ghost sm" (click)="showArchived.set(!showArchived())">
          <mat-icon>{{ showArchived() ? 'visibility_off' : 'visibility' }}</mat-icon>
          {{ c.policies.showArchived }}
        </button>
      </ui-toolbar>

      <ui-card>
        <table class="data-table" *ngIf="filtered().length; else emptyState">
          <colgroup>
            <col style="width: 40%"><col style="width: 18%"><col style="width: 27%"><col style="width: 15%">
          </colgroup>
          <thead>
            <tr>
              <th>{{ c.policies.tableTitle }}</th>
              <th>{{ c.policies.tableAcknowledged }}</th>
              <th>{{ c.policies.tableMappedControls }}</th>
              <th>{{ c.policies.tableReview }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filtered()" class="data-row" (click)="openDetail(p)">
              <td class="title-cell">
                <div class="name">{{ p.title }}</div>
                <div class="category">{{ p.category }}</div>
                <ui-badge *ngIf="p.status === 'ARCHIVED'" variant="neutral">{{ c.policies.archivedBadge }}</ui-badge>
              </td>
              <td>
                <div class="ack-line" [class.full]="p.acknowledgedCount === p.totalMembers && p.totalMembers > 0">
                  {{ p.acknowledgedCount }} / {{ p.totalMembers }}
                </div>
              </td>
              <td>
                <div class="chips" *ngIf="p.mappedControlCodes.length; else noMapped">
                  <span class="chip" *ngFor="let code of p.mappedControlCodes">{{ code }}</span>
                </div>
                <ng-template #noMapped><span class="muted-cell">{{ c.policies.noMappedControls }}</span></ng-template>
              </td>
              <td>
                <span class="muted-cell">{{ p.nextReviewDate || '—' }}</span>
                <div *ngIf="isOverdue(p)"><ui-badge variant="warning">{{ c.policies.reviewOverdueBadge }}</ui-badge></div>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #emptyState>
          <ui-empty-state icon="gavel" [title]="c.policies.emptyTitle" [description]="c.policies.emptyMessage"></ui-empty-state>
        </ng-template>
        <div class="count-line" *ngIf="filtered().length">{{ c.policies.listCaption(filtered().length) }}</div>
      </ui-card>

      <ui-card [title]="c.policies.templateLibraryTitle" [caption]="c.policies.templateLibraryCaption" style="display:block;margin-top:var(--space-4);">
        <div class="template-grid">
          <div class="template-item" *ngFor="let t of templates">
            <mat-icon>description</mat-icon>
            <span class="name">{{ t.name }}</span>
            <a [href]="'/assets/policy-templates/' + t.file" download>{{ c.policies.downloadTemplate }}</a>
          </div>
        </div>
      </ui-card>
    </div>
  `,
})
export class PoliciesComponent implements OnInit {
  readonly c = CAPTIONS;
  readonly templates = TEMPLATE_LIBRARY;
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  me = signal<Me | null>(null);
  policies = signal<Policy[]>([]);
  coverage = signal<PolicyCoverage | null>(null);
  categories = signal<string[]>([]);
  search = signal('');
  showArchived = signal(false);

  title = '';
  category = '';
  description = '';
  file: File | null = null;
  publishing = signal(false);
  publishError = signal<string | null>(null);

  canManage = computed(() => {
    const role = this.me()?.role;
    return role === 'OWNER' || role === 'ADMIN';
  });

  filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.policies()
      .filter(p => this.showArchived() || p.status !== 'ARCHIVED')
      .filter(p => !term || p.title.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.api.me().subscribe(m => this.me.set(m));
    this.api.policyCategories().subscribe(cats => this.categories.set(cats));
    this.reload();
  }

  filteredCategories(): string[] {
    const term = this.category.trim().toLowerCase();
    const all = this.categories();
    return term ? all.filter(c => c.toLowerCase().includes(term)) : all;
  }

  reload(): void {
    this.api.policies().subscribe(list => this.policies.set(list));
    this.api.policyCoverage().subscribe(cov => this.coverage.set(cov));
  }

  isOverdue(p: Policy): boolean {
    if (!p.nextReviewDate) return false;
    return new Date(p.nextReviewDate) < new Date(new Date().toDateString());
  }

  // Ring math: circumference of r=58 is 2*PI*58 ≈ 364.42.
  coverageRingDash(cov: PolicyCoverage): string {
    const circ = 2 * Math.PI * 58;
    const pct = cov.totalControls > 0 ? (cov.coveredCount / cov.totalControls) * 100 : 0;
    const fill = Math.max(0, Math.min(100, pct)) / 100 * circ;
    return `${fill} ${circ}`;
  }

  openDetail(p: Policy): void {
    this.router.navigate(['/policies', p.id]);
  }

  fileChanged(files: FileList | null): void {
    this.file = files && files.length ? files[0] : null;
  }

  publish(): void {
    if (!this.file || !this.title || !this.category) return;
    const form = new FormData();
    form.append('title', this.title);
    form.append('category', this.category);
    if (this.description) form.append('description', this.description);
    form.append('file', this.file);
    this.publishing.set(true);
    this.publishError.set(null);
    this.api.createPolicy(form).subscribe({
      next: () => {
        this.title = ''; this.category = ''; this.description = ''; this.file = null;
        this.reload();
      },
      error: (e) => this.publishError.set(e?.error?.message ?? this.c.policies.genericError),
      complete: () => this.publishing.set(false),
    });
  }
}
