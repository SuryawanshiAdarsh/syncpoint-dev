import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { ApiService } from '../../core/api/api.service';
import { Control, Evidence } from '../../core/api/api.types';
import { CAPTIONS } from '@captions';

@Component({
  standalone: true,
  selector: 'app-evidence',
  imports: [CommonModule, FormsModule, MatButtonModule,
            MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatMenuModule],
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

    .source-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px;
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: 999px;
      font-size: 12px;
      color: var(--color-text-secondary);
    }
    .source-pill mat-icon { font-size: 12px; height: 12px; width: 12px; }

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
  `],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="eyebrow">{{ c.evidence.eyebrow }}</div>
          <h1>{{ c.evidence.title }}</h1>
          <p class="subtitle">{{ c.evidence.subtitle }}</p>
        </div>
      </div>

      <!-- Upload zone -->
      <div class="card">
        <div class="card-header">
          <h2>Upload evidence</h2>
          <span class="muted small">PDF, CSV, JSON, TXT, DOCX, XLSX · max 50 MB</span>
        </div>

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
      </div>

      <!-- All evidence -->
      <div class="card" style="padding: 0;">
        <div class="card-header" style="padding: 20px 24px;">
          <h2>All evidence</h2>
          <span class="muted small">{{ items().length }} artifact{{ items().length === 1 ? '' : 's' }}</span>
        </div>

        <table class="data-table" *ngIf="items().length; else empty">
          <thead><tr>
            <th style="padding-left:24px;">Name</th>
            <th>Source</th>
            <th>Status</th>
            <th>Freshness</th>
            <th style="text-align:right;padding-right:24px;">Actions</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let e of items()">
              <td style="padding-left:24px;">
                <div class="name-cell">
                  <div class="file-icon-wrap"><mat-icon>{{ mimeIcon(e.mimeType) }}</mat-icon></div>
                  <div>
                    <div class="name">{{ e.name }}</div>
                    <div class="sub">{{ (e.sizeBytes ?? 0) | number }} bytes · {{ e.collectedAt | date:'MMM d, h:mm a' }}</div>
                  </div>
                </div>
              </td>
              <td><span class="source-pill"><mat-icon>{{ sourceIcon(e.sourceType) }}</mat-icon>{{ sourceLabel(e.sourceType) }}</span></td>
              <td><span class="badge" [class]="evStatusClass(e.status)">{{ e.status | titlecase }}</span></td>
              <td><span class="badge" [class]="freshnessClass(e.freshness)">{{ e.freshness | titlecase }}</span></td>
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

        <ng-template #empty>
          <div class="empty">
            <div class="icon-wrap"><mat-icon>upload_file</mat-icon></div>
            <h3>No evidence uploaded yet</h3>
            <p>Drop a file above or connect an integration to collect evidence automatically.</p>
          </div>
        </ng-template>
      </div>

      <div *ngIf="msg()" class="toast">
        <mat-icon>check_circle</mat-icon>{{ msg() }}
      </div>
    </div>
  `,
})
export class EvidenceComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

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

  ngOnInit(): void {
    this.reload();
    this.api.controls().subscribe(cs => this.controls.set(cs));
  }

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

  freshnessClass(s: string): string { return { CURRENT: 'covered', EXPIRING: 'partial', EXPIRED: 'missing' }[s] ?? ''; }
  evStatusClass(s: string): string { return { APPROVED: 'approved', COLLECTED: 'pending', UNDER_REVIEW: 'running', REJECTED: 'rejected', EXPIRED: 'error' }[s] ?? ''; }
  sourceIcon(s: string): string { return { MANUAL_UPLOAD: 'upload_file', GITHUB: 'code', AWS: 'cloud', JIRA: 'bug_report', GOOGLE_WORKSPACE: 'groups' }[s] ?? 'description'; }
  sourceLabel(s: string): string { return { MANUAL_UPLOAD: 'Manual', GITHUB: 'GitHub', AWS: 'AWS', JIRA: 'Jira', GOOGLE_WORKSPACE: 'Google' }[s] ?? s; }
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
