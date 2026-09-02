import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { ApiService } from '../../core/api/api.service';
import { Control, Evidence, EvidenceSourceType, FreshnessState } from '../../core/api/api.types';
import { CAPTIONS } from '@captions';
import { EVIDENCE_SOURCE, FRESHNESS, evidenceSourceLabel as _sourceLabel } from '@constants';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiSearchComponent,
  UiToolbarComponent,
  UiFilterChipsComponent,
  UiEvidenceStatusBadgeComponent,
  UiFreshnessBadgeComponent,
  UiSourcePillComponent,
  UiFilterChip,
} from '@ui';

type StatusChipKey = 'NEEDS_ATTENTION' | 'ALL' | 'APPROVED';
type MappedFilter = '' | 'MAPPED' | 'UNMAPPED';

@Component({
  standalone: true,
  selector: 'app-evidence',
  imports: [
    CommonModule, FormsModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatMenuModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent,
    UiSearchComponent, UiToolbarComponent, UiFilterChipsComponent,
    UiEvidenceStatusBadgeComponent, UiFreshnessBadgeComponent, UiSourcePillComponent,
  ],
  styles: [`
    /* Drop-zone upload */
    .dropzone {
      border: 2px dashed var(--color-border-strong);
      border-radius: var(--radius-lg);
      background: var(--color-surface-muted);
      padding: 28px;
      display: flex; align-items: center; gap: 20px;
      transition: all 120ms var(--ease-out);
      cursor: pointer;
    }
    .dropzone:hover { border-color: var(--color-primary); background: var(--color-primary-soft); }
    .dropzone.has-file { border-color: var(--color-success); background: var(--color-success-soft); }
    .dropzone.dragover { border-color: var(--color-primary); background: var(--color-primary-soft); transform: scale(1.005); }

    .dropzone-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: var(--color-surface);
      color: var(--color-primary);
      display: grid; place-items: center;
      box-shadow: var(--shadow-sm);
      flex-shrink: 0;
    }
    .dropzone.has-file .dropzone-icon { color: var(--color-success-text); }
    .dropzone-icon mat-icon { font-size: 24px; height: 24px; width: 24px; }

    .dropzone-text .title { font-weight: 600; font-size: 14.5px; }
    .dropzone-text .sub   { color: var(--color-text-muted); font-size: 12.5px; margin-top: 3px; }

    .form-row { display: flex; gap: 12px; align-items: end; margin-top: 20px; }
    @media (max-width: 700px) { .form-row { flex-direction: column; align-items: stretch; } }

    /* Cell layouts */
    .name-cell { display: flex; align-items: center; gap: 12px; }
    .file-icon-wrap {
      width: 32px; height: 32px; border-radius: 8px;
      background: var(--color-primary-soft); color: var(--color-primary);
      display: grid; place-items: center; flex-shrink: 0;
    }
    .file-icon-wrap mat-icon { font-size: 16px; height: 16px; width: 16px; }
    .name-cell .name { font-weight: 500; }
    .name-cell .sub { color: var(--color-text-muted); font-size: 12px; margin-top: 2px; }

    .source-cell { display: flex; align-items: center; gap: 8px; }
    .unmapped-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--color-warning, #f59e0b);
      flex-shrink: 0;
    }

    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      background: var(--color-success-soft);
      border: 1px solid var(--color-success-border);
      border-radius: var(--radius-md);
      color: var(--color-success-text);
      font-size: 13.5px;
      margin-top: 12px;
    }
    .toast mat-icon { font-size: 18px; height: 18px; width: 18px; }
    .toast.error { background: var(--color-danger-soft); border-color: var(--color-danger-border); color: var(--color-danger-text); }

    .row-actions { display: flex; gap: 6px; align-items: center; justify-content: flex-end; }

    .count-line {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      padding: 12px var(--space-6);
    }
    .pager {
      display: flex; align-items: center; justify-content: center; gap: 14px;
      padding: 14px var(--space-6);
      border-top: 1px solid var(--color-divider);
    }
  `],
  template: `
    <div class="page">
      <ui-page-header
        [eyebrow]="c.evidence.eyebrow"
        [title]="c.evidence.title"
        [subtitle]="c.evidence.subtitle">
      </ui-page-header>

      <!-- Upload zone -->
      <ui-card [title]="c.evidence.uploadCardTitle" [caption]="c.evidence.uploadCardCaption">
        <label class="dropzone" [class.has-file]="!!file" [class.dragover]="dragover()"
               (dragover)="onDragOver($event)" (dragleave)="dragover.set(false)"
               (drop)="onDrop($event)">
          <div class="dropzone-icon">
            <mat-icon>{{ file ? 'check_circle' : 'cloud_upload' }}</mat-icon>
          </div>
          <div class="dropzone-text" style="flex:1;">
            <div class="title">{{ file ? file.name : 'Drop file here or click to browse' }}</div>
            <div class="sub" *ngIf="!file">Files are hashed and stored in encrypted object storage.</div>
            <div class="sub" *ngIf="file">{{ (file.size / 1024) | number:'1.0-0' }} KB · Ready to upload</div>
          </div>
          <input #f type="file" (change)="fileChanged(f.files)" hidden>
        </label>

        <div class="form-row">
          <mat-form-field appearance="outline" style="flex:2;" subscriptSizing="dynamic">
            <mat-label>Display name (optional)</mat-label>
            <input matInput [(ngModel)]="name" placeholder="Q1-2026 Access Review">
          </mat-form-field>
          <mat-form-field appearance="outline" style="flex:3;" subscriptSizing="dynamic">
            <mat-label>Description (optional)</mat-label>
            <input matInput [(ngModel)]="description">
          </mat-form-field>
          <button class="btn primary" (click)="upload()" [disabled]="!file || uploading()">
            <mat-icon>{{ uploading() ? 'hourglass_top' : 'upload' }}</mat-icon>
            {{ uploading() ? 'Uploading…' : 'Upload evidence' }}
          </button>
        </div>

        <div *ngIf="uploadError()" class="toast error">
          <mat-icon>error_outline</mat-icon>{{ uploadError() }}
        </div>
      </ui-card>

      <!-- Filters -->
      <ui-toolbar style="display:block;margin-top: var(--space-6);">
        <ui-search leading
                   [value]="search()"
                   (valueChange)="onSearchChange($event)"
                   [placeholder]="c.evidence.searchPlaceholder">
        </ui-search>
        <mat-form-field trailing appearance="outline" style="width:170px;" subscriptSizing="dynamic">
          <mat-label>{{ c.evidence.filterSource }}</mat-label>
          <mat-select [ngModel]="sourceFilter()" (ngModelChange)="onSourceChange($event)">
            <mat-option value="">{{ c.evidence.filterAllSources }}</mat-option>
            <mat-option *ngFor="let s of sourceOptions" [value]="s">{{ sourceLabel(s) }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field trailing appearance="outline" style="width:160px;" subscriptSizing="dynamic">
          <mat-label>{{ c.evidence.filterFreshness }}</mat-label>
          <mat-select [ngModel]="freshnessFilter()" (ngModelChange)="onFreshnessChange($event)">
            <mat-option value="">{{ c.evidence.filterAllFreshness }}</mat-option>
            <mat-option *ngFor="let f of freshnessOptions" [value]="f">{{ freshnessLabel(f) }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field trailing appearance="outline" style="width:140px;" subscriptSizing="dynamic">
          <mat-label>{{ c.evidence.filterMapped }}</mat-label>
          <mat-select [ngModel]="mappedFilter()" (ngModelChange)="onMappedChange($event)">
            <mat-option value="">{{ c.evidence.filterAllMapped }}</mat-option>
            <mat-option value="MAPPED">{{ c.evidence.filterMappedOnly }}</mat-option>
            <mat-option value="UNMAPPED">{{ c.evidence.filterUnmappedOnly }}</mat-option>
          </mat-select>
        </mat-form-field>
      </ui-toolbar>

      <ui-filter-chips
        [chips]="statusChips()"
        [selected]="statusFilter()"
        (selectedChange)="onStatusChipChange($event)"
        style="display:block;margin-bottom: var(--space-4);">
      </ui-filter-chips>

      <!-- All evidence -->
      <ui-card padding="flush">
        <div class="count-line">{{ c.evidence.countLine(filtered().length, items().length) }}</div>

        <table class="data-table" *ngIf="paged().length; else empty">
          <thead><tr>
            <th style="padding-left:24px;">{{ c.evidence.tableName }}</th>
            <th>{{ c.evidence.tableSource }}</th>
            <th>{{ c.evidence.tableStatus }}</th>
            <th>{{ c.evidence.tableFreshness }}</th>
            <th style="text-align:right;padding-right:24px;">{{ c.evidence.tableActions }}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let e of paged()">
              <td style="padding-left:24px;">
                <div class="name-cell">
                  <div class="file-icon-wrap"><mat-icon>{{ mimeIcon(e.mimeType) }}</mat-icon></div>
                  <div>
                    <div class="name">{{ e.name }}</div>
                    <div class="sub">{{ (e.sizeBytes ?? 0) | number }} bytes · {{ e.collectedAt | date:'MMM d, h:mm a' }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="source-cell">
                  <ui-source-pill [source]="e.sourceType"></ui-source-pill>
                  <span class="unmapped-dot" *ngIf="!e.mapped" title="Not mapped to a control"></span>
                </div>
              </td>
              <td><ui-evidence-status-badge [status]="e.status"></ui-evidence-status-badge></td>
              <td><ui-freshness-badge [freshness]="e.freshness"></ui-freshness-badge></td>
              <td style="padding-right:24px;">
                <div class="row-actions">
                  <mat-form-field appearance="outline" style="width:180px;" subscriptSizing="dynamic">
                    <mat-label>Map to control</mat-label>
                    <mat-select [(ngModel)]="selectedControl[e.id]">
                      <mat-option *ngFor="let c of controls()" [value]="c.id">{{ c.code }} — {{ c.title }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <button class="btn ghost sm" [matMenuTriggerFor]="actionMenu" [disabled]="!selectedControl[e.id]">
                    <mat-icon style="font-size:16px;height:16px;width:16px;">more_horiz</mat-icon>
                  </button>
                  <mat-menu #actionMenu="matMenu">
                    <button mat-menu-item (click)="map(e.id)"><mat-icon>check_circle</mat-icon><span>Confirm mapping</span></button>
                    <button mat-menu-item (click)="analyze(e.id)" [disabled]="analyzing()[e.id]">
                      <mat-icon>auto_awesome</mat-icon>
                      <span>{{ analyzing()[e.id] ? 'Analyzing…' : 'AI analyze' }}</span>
                    </button>
                    <button mat-menu-item (click)="approve(e.id)"><mat-icon>done_all</mat-icon><span>Approve evidence</span></button>
                  </mat-menu>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pager" *ngIf="filtered().length">
          <button class="btn ghost sm" (click)="prevPage()" [disabled]="page() === 0">{{ c.evidence.pagePrev }}</button>
          <span class="muted small">{{ c.evidence.pageIndicator(page() + 1, totalPages()) }}</span>
          <button class="btn ghost sm" (click)="nextPage()" [disabled]="page() >= totalPages() - 1">{{ c.evidence.pageNext }}</button>
        </div>

        <ng-template #empty>
          <ui-empty-state
            [icon]="items().length ? 'filter_alt_off' : 'upload_file'"
            [title]="items().length ? c.evidence.emptyFilterTitle : c.evidence.emptyTitle"
            [description]="items().length ? c.evidence.emptyFilterMessage : c.evidence.emptyMessage">
          </ui-empty-state>
        </ng-template>
      </ui-card>

      <div *ngIf="msg()" class="toast">
        <mat-icon>check_circle</mat-icon>{{ msg() }}
      </div>
    </div>
  `,
})
export class EvidenceComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  readonly sourceOptions = Object.values(EVIDENCE_SOURCE);
  readonly freshnessOptions = Object.values(FRESHNESS);
  readonly pageSize = 25;

  items = signal<Evidence[]>([]);
  controls = signal<Control[]>([]);
  name = '';
  description = '';
  file: File | null = null;
  uploading = signal(false);
  uploadError = signal<string | null>(null);
  analyzing = signal<Record<string, boolean>>({});
  msg = signal<string | null>(null);
  dragover = signal(false);
  selectedControl: Record<string, string> = {};

  search = signal('');
  statusFilter = signal<StatusChipKey>('NEEDS_ATTENTION');
  sourceFilter = signal<'' | EvidenceSourceType>('');
  freshnessFilter = signal<'' | FreshnessState>('');
  mappedFilter = signal<MappedFilter>('');
  page = signal(0);

  statusChips = computed<UiFilterChip[]>(() => {
    const list = this.items();
    const needsAttention = list.filter(e => e.status === 'COLLECTED' || e.status === 'UNDER_REVIEW').length;
    const approved = list.filter(e => e.status === 'APPROVED').length;
    return [
      { key: 'NEEDS_ATTENTION', label: this.c.evidence.chipNeedsAttention, count: needsAttention, colorDot: '#f59e0b' },
      { key: 'ALL',             label: this.c.evidence.chipAll,            count: list.length },
      { key: 'APPROVED',        label: this.c.evidence.chipApproved,       count: approved, colorDot: '#10b981' },
    ];
  });

  filtered = computed(() => {
    const status = this.statusFilter();
    const source = this.sourceFilter();
    const freshness = this.freshnessFilter();
    const mapped = this.mappedFilter();
    const q = this.search().toLowerCase().trim();
    return this.items().filter(e => {
      if (status === 'NEEDS_ATTENTION' && !(e.status === 'COLLECTED' || e.status === 'UNDER_REVIEW')) return false;
      if (status === 'APPROVED' && e.status !== 'APPROVED') return false;
      if (source && e.sourceType !== source) return false;
      if (freshness && e.freshness !== freshness) return false;
      if (mapped === 'MAPPED' && !e.mapped) return false;
      if (mapped === 'UNMAPPED' && e.mapped) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  paged = computed(() => {
    const start = this.page() * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.reload();
    this.api.controls().subscribe(cs => this.controls.set(cs));
  }

  onStatusChipChange(key: string): void {
    this.statusFilter.set(key as StatusChipKey);
    this.page.set(0);
  }
  onSourceChange(v: '' | EvidenceSourceType): void {
    this.sourceFilter.set(v);
    this.page.set(0);
  }
  onFreshnessChange(v: '' | FreshnessState): void {
    this.freshnessFilter.set(v);
    this.page.set(0);
  }
  onMappedChange(v: MappedFilter): void {
    this.mappedFilter.set(v);
    this.page.set(0);
  }
  onSearchChange(v: string): void {
    this.search.set(v);
    this.page.set(0);
  }
  prevPage(): void { this.page.update(p => Math.max(0, p - 1)); }
  nextPage(): void { this.page.update(p => Math.min(this.totalPages() - 1, p + 1)); }

  fileChanged(files: FileList | null): void {
    this.file = files && files.length ? files[0] : null;
    if (this.file && !this.name) this.name = this.file.name;
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.dragover.set(true);
  }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragover.set(false);
    this.fileChanged(e.dataTransfer?.files ?? null);
  }

  upload(): void {
    if (!this.file) return;
    const form = new FormData();
    if (this.name) form.append('name', this.name);
    if (this.description) form.append('description', this.description);
    form.append('file', this.file);
    this.uploading.set(true);
    this.uploadError.set(null);
    this.api.uploadEvidence(form).subscribe({
      next: () => {
        this.msg.set(`Uploaded "${this.name || this.file?.name}"`);
        this.name = ''; this.description = ''; this.file = null;
        this.reload();
      },
      error: (e) => this.uploadError.set(e?.error?.message ?? 'Upload failed'),
      complete: () => this.uploading.set(false),
    });
  }

  map(evidenceId: string): void {
    const controlId = this.selectedControl[evidenceId];
    if (!controlId) return;
    this.api.createMapping(evidenceId, {
      controlId, mappingType: 'HUMAN_CONFIRMED',
      classification: 'COVERED', confidence: 1, reason: 'Reviewer confirmed.',
    }).subscribe(() => { this.msg.set('Mapping confirmed.'); this.reload(); });
  }

  analyze(evidenceId: string): void {
    const controlId = this.selectedControl[evidenceId];
    if (!controlId) return;
    this.analyzing.update(x => ({ ...x, [evidenceId]: true }));
    this.api.analyzeEvidence(evidenceId, { controlId }).subscribe({
      next: (r) => {
        this.msg.set(`AI analyzed → ${r['classification']} (${r['provider']} · ${r['model']})`);
        this.reload();
      },
      complete: () => this.analyzing.update(x => ({ ...x, [evidenceId]: false })),
    });
  }

  approve(evidenceId: string): void {
    this.api.reviewEvidence(evidenceId, { decision: 'APPROVED', comments: 'OK' })
      .subscribe(() => { this.msg.set('Evidence approved.'); this.reload(); });
  }

  sourceLabel(s: string): string { return _sourceLabel(s); }
  freshnessLabel(s: string): string {
    return ({ CURRENT: 'Current', EXPIRING: 'Expiring', EXPIRED: 'Expired' } as Record<string, string>)[s] ?? s;
  }
  mimeIcon(m?: string): string {
    if (!m) return 'description';
    if (m.includes('pdf')) return 'picture_as_pdf';
    if (m.includes('csv') || m.includes('excel') || m.includes('spreadsheet')) return 'table_chart';
    if (m.includes('json')) return 'data_object';
    if (m.includes('word') || m.includes('doc')) return 'article';
    if (m.startsWith('text/')) return 'article';
    return 'description';
  }

  private reload(): void {
    this.api.evidence().subscribe(list => this.items.set(list));
  }
}

