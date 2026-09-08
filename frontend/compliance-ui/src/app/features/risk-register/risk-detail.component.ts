import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '@core/api/api.service';
import { Risk, RiskCategory, RiskLevel, RiskStatus, Control, Member, Me } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import { UiCardComponent, UiEmptyStateComponent, UiBadgeComponent } from '@ui';

const CATEGORIES: RiskCategory[] = ['FRAUD', 'OPERATIONAL', 'TECHNOLOGY', 'COMPLIANCE', 'THIRD_PARTY', 'FINANCIAL'];
const LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES: RiskStatus[] = ['IDENTIFIED', 'MITIGATING', 'MITIGATED', 'ACCEPTED'];

/** Owns every risk action (status, owner, controls, edit, delete) — the list page is view-only. */
@Component({
  standalone: true,
  selector: 'app-risk-detail',
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    UiCardComponent, UiEmptyStateComponent, UiBadgeComponent,
  ],
  styles: [`
    .back {
      display: inline-flex; align-items: center; gap: 4px;
      color: var(--color-text-muted); font-size: 13px; margin-bottom: 16px;
      transition: color var(--transition-fast);
    }
    .back:hover { color: var(--color-text); }
    .back mat-icon { font-size: 16px; height: 16px; width: 16px; }

    .hero {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 32px 36px;
      margin-bottom: var(--space-4);
    }
    .badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .hero h1 { font-size: 26px; margin: 0 0 10px 0; letter-spacing: -0.02em; line-height: 1.25; }
    .hero .desc { color: var(--color-text-secondary); font-size: 14px; line-height: 1.65; max-width: 780px; margin: 0; }

    .meta-primary {
      display: flex; gap: 28px; flex-wrap: wrap;
      margin-top: 28px; padding-top: 22px; border-top: 1px solid var(--color-divider);
    }
    .meta-primary .item { flex: 1 1 150px; min-width: 150px; }
    .meta-primary .item .label, .meta-controls .label {
      color: var(--color-text-muted); font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.06em; margin-bottom: 7px;
    }
    .meta-primary .item .val { font-size: 14.5px; font-weight: 600; }
    .meta-primary .item mat-form-field { width: 100%; }

    .meta-controls { margin-top: 22px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: var(--radius-full);
      background: var(--color-surface-muted); border: 1px solid var(--color-border);
      font-size: 12px; font-family: var(--font-mono); color: var(--color-text-secondary);
    }
    .chip button {
      background: none; border: none; cursor: pointer; padding: 0; margin: 0;
      color: var(--color-text-muted); display: grid; place-items: center;
    }
    .chip button:hover { color: var(--color-text); }
    .chip button mat-icon { font-size: 14px; height: 14px; width: 14px; }
    .no-controls { font-size: 14.5px; color: var(--color-text-secondary); }
    .add-control-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 4px; }

    .actions-row {
      display: flex; gap: 10px; flex-wrap: wrap;
      margin-top: 28px; padding-top: 22px; border-top: 1px solid var(--color-divider);
    }

    .toast {
      display: flex; align-items: center; gap: 10px; padding: 12px 16px;
      background: var(--color-success-soft); border: 1px solid var(--color-success-border);
      border-radius: var(--radius-md); color: var(--color-success-text); font-size: 13.5px; margin-top: 12px;
    }
    .toast.error { background: var(--color-danger-soft); border-color: var(--color-danger-border); color: var(--color-danger-text); }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4);
    }
    .modal-card {
      background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);
      max-width: 480px; width: 100%; padding: var(--space-6);
    }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
    .modal-title { font-size: 18px; font-weight: var(--weight-semibold); margin: 0; }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: var(--radius-md); }
    .modal-close:hover { background: var(--color-surface-muted); }
    .modal-field { margin-bottom: 14px; }
    .modal-field mat-form-field { width: 100%; }
    .modal-row { display: flex; gap: 12px; }
    .modal-row mat-form-field { flex: 1; }
    .modal-actions { margin-top: var(--space-4); display: flex; justify-content: flex-end; gap: 10px; }
  `],
  template: `
    <div class="page">
      <a routerLink="/risk-register" class="back"><mat-icon>arrow_back</mat-icon> {{ c.riskDetail.backToRiskRegister }}</a>

      <ng-container *ngIf="risk() as r; else notFound">
        <div class="hero">
          <div class="badges">
            <span class="chip">{{ categoryLabel(r.category) }}</span>
            <ui-badge [variant]="scoreVariant(r.score)">{{ c.riskDetail.scoreLabel }}: {{ r.score }}</ui-badge>
          </div>
          <h1>{{ r.title }}</h1>
          <p class="desc" *ngIf="r.description">{{ r.description }}</p>

          <div class="meta-primary">
            <div class="item">
              <div class="label">{{ c.riskDetail.likelihoodLabel }}</div>
              <div class="val">{{ levelLabel(r.likelihood) }}</div>
            </div>
            <div class="item">
              <div class="label">{{ c.riskDetail.impactLabel }}</div>
              <div class="val">{{ levelLabel(r.impact) }}</div>
            </div>
            <div class="item">
              <div class="label">{{ c.riskDetail.statusLabel }}</div>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" *ngIf="canManage(); else statusText">
                <mat-select [ngModel]="r.status" (ngModelChange)="changeStatus($event)">
                  <mat-option *ngFor="let s of statuses" [value]="s">{{ statusLabel(s) }}</mat-option>
                </mat-select>
              </mat-form-field>
              <ng-template #statusText><div class="val">{{ statusLabel(r.status) }}</div></ng-template>
            </div>
            <div class="item">
              <div class="label">{{ c.riskDetail.ownerLabel }}</div>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" *ngIf="canManage(); else ownerText">
                <mat-select [ngModel]="r.ownerUserId ?? null" (ngModelChange)="changeOwner($event)">
                  <mat-option [value]="null">{{ c.riskDetail.ownerUnassigned }}</mat-option>
                  <mat-option *ngFor="let m of members()" [value]="m.userId">{{ m.name }}</mat-option>
                </mat-select>
              </mat-form-field>
              <ng-template #ownerText><div class="val">{{ r.ownerName ?? c.riskDetail.ownerUnassigned }}</div></ng-template>
            </div>
            <div class="item">
              <div class="label">{{ c.riskDetail.nextReviewLabel }}</div>
              <div class="val">{{ r.nextReviewDate ?? c.riskDetail.noNextReview }}</div>
            </div>
          </div>

          <div class="meta-controls">
            <div class="label">{{ c.riskDetail.controlsLabel }}</div>
            <div class="chips" *ngIf="r.linkedControlCodes.length">
              <span class="chip" *ngFor="let code of r.linkedControlCodes; let i = index">
                {{ code }}
                <button *ngIf="canManage()" [title]="c.riskDetail.removeControl" (click)="removeControl(r.linkedControlIds[i])">
                  <mat-icon>close</mat-icon>
                </button>
              </span>
            </div>
            <div class="no-controls" *ngIf="!r.linkedControlCodes.length">{{ c.riskDetail.noControlsLinked }}</div>

            <div class="add-control-row" *ngIf="canManage()">
              <mat-form-field appearance="outline" subscriptSizing="dynamic" style="width:280px;">
                <mat-label>{{ c.riskDetail.addControlLabel }}</mat-label>
                <mat-select [(ngModel)]="addControlId">
                  <mat-option *ngFor="let ctl of unmappedControls()" [value]="ctl.id">{{ ctl.code }} — {{ ctl.title }}</mat-option>
                </mat-select>
              </mat-form-field>
              <button class="btn ghost sm" [disabled]="!addControlId" (click)="addControl()">{{ c.riskDetail.addButton }}</button>
            </div>
          </div>

          <div class="actions-row" *ngIf="canManage()">
            <button class="btn ghost sm" (click)="openEdit(r)">
              <mat-icon>edit</mat-icon> {{ c.riskDetail.editButton }}
            </button>
            <button class="btn ghost sm" *ngIf="canDelete()" (click)="remove(r)">
              <mat-icon>delete</mat-icon> {{ c.riskDetail.deleteButton }}
            </button>
          </div>

          <div class="toast" *ngIf="msg()"><mat-icon>check_circle</mat-icon>{{ msg() }}</div>
          <div class="toast error" *ngIf="err()"><mat-icon>error_outline</mat-icon>{{ err() }}</div>
        </div>
      </ng-container>

      <ng-template #notFound>
        <ui-empty-state icon="report_problem" [title]="c.riskDetail.notFoundTitle" [description]="c.riskDetail.notFoundMessage"></ui-empty-state>
      </ng-template>

      <div class="modal-backdrop" *ngIf="editing()" (click)="closeEdit()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ c.riskDetail.editModalTitle }}</h3>
            <button class="modal-close" (click)="closeEdit()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="modal-field">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.riskDetail.titleLabel }}</mat-label>
              <input matInput [(ngModel)]="editTitle">
            </mat-form-field>
          </div>
          <div class="modal-field">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.riskDetail.descriptionLabel }}</mat-label>
              <textarea matInput rows="2" [(ngModel)]="editDescription"></textarea>
            </mat-form-field>
          </div>
          <div class="modal-field">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.riskDetail.categoryLabel }}</mat-label>
              <mat-select [(ngModel)]="editCategory">
                <mat-option *ngFor="let cat of categories" [value]="cat">{{ categoryLabel(cat) }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="modal-row">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.riskDetail.likelihoodLabel }}</mat-label>
              <mat-select [(ngModel)]="editLikelihood">
                <mat-option *ngFor="let lvl of levels" [value]="lvl">{{ levelLabel(lvl) }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.riskDetail.impactLabel }}</mat-label>
              <mat-select [(ngModel)]="editImpact">
                <mat-option *ngFor="let lvl of levels" [value]="lvl">{{ levelLabel(lvl) }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="modal-field">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.riskDetail.nextReviewLabel }}</mat-label>
              <input matInput type="date" [(ngModel)]="editNextReviewDate">
            </mat-form-field>
          </div>
          <div class="modal-actions">
            <button class="btn ghost" (click)="closeEdit()">{{ c.common.cancel }}</button>
            <button class="btn primary" [disabled]="savingEdit()" (click)="saveEdit()">
              {{ savingEdit() ? c.riskDetail.savingButton : c.common.save }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RiskDetailComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = CATEGORIES;
  readonly levels = LEVELS;
  readonly statuses = STATUSES;

  private id = '';
  me = signal<Me | null>(null);
  risk = signal<Risk | null>(null);
  members = signal<Member[]>([]);
  controls = signal<Control[]>([]);
  addControlId: string | null = null;

  msg = signal<string | null>(null);
  err = signal<string | null>(null);

  editing = signal<Risk | null>(null);
  savingEdit = signal(false);
  editTitle = '';
  editDescription = '';
  editCategory: RiskCategory = 'OPERATIONAL';
  editLikelihood: RiskLevel = 'MEDIUM';
  editImpact: RiskLevel = 'MEDIUM';
  editNextReviewDate = '';

  canManage = computed(() => {
    const r = this.me()?.role;
    return r === 'OWNER' || r === 'ADMIN' || r === 'REVIEWER';
  });
  canDelete = computed(() => {
    const r = this.me()?.role;
    return r === 'OWNER' || r === 'ADMIN';
  });

  unmappedControls = computed(() => {
    const linked = new Set(this.risk()?.linkedControlIds ?? []);
    return this.controls().filter(c => !linked.has(c.id));
  });

  ngOnInit(): void {
    this.api.me().subscribe(m => this.me.set(m));
    this.api.members().subscribe(list => this.members.set(list));
    this.api.controls().subscribe(list => this.controls.set(list));
    this.route.paramMap.subscribe(pm => {
      this.id = pm.get('id') ?? '';
      this.reload();
    });
  }

  private reload(): void {
    if (!this.id) return;
    this.api.risk(this.id).subscribe({
      next: (r) => this.risk.set(r),
      error: () => this.risk.set(null),
    });
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

  changeStatus(status: RiskStatus): void {
    this.api.updateRiskStatus(this.id, status).subscribe({
      next: (updated) => { this.risk.set(updated); this.msg.set(this.c.riskDetail.statusUpdatedToast); this.err.set(null); },
      error: (e) => this.err.set(e?.error?.message ?? this.c.riskDetail.actionError),
    });
  }

  changeOwner(userId: string | null): void {
    this.api.assignRiskOwner(this.id, userId).subscribe({
      next: (updated) => { this.risk.set(updated); this.msg.set(this.c.riskDetail.ownerUpdatedToast); this.err.set(null); },
      error: (e) => this.err.set(e?.error?.message ?? this.c.riskDetail.actionError),
    });
  }

  addControl(): void {
    const r = this.risk();
    if (!r || !this.addControlId) return;
    const controlIds = [...r.linkedControlIds, this.addControlId];
    this.updateControls(r, controlIds);
  }

  removeControl(controlId: string): void {
    const r = this.risk();
    if (!r) return;
    const controlIds = r.linkedControlIds.filter(id => id !== controlId);
    this.updateControls(r, controlIds);
  }

  private updateControls(r: Risk, controlIds: string[]): void {
    this.api.updateRisk(this.id, {
      title: r.title, description: r.description, category: r.category,
      likelihood: r.likelihood, impact: r.impact, ownerUserId: r.ownerUserId ?? null,
      nextReviewDate: r.nextReviewDate ?? null, controlIds,
    }).subscribe({
      next: (updated) => {
        this.risk.set(updated);
        this.addControlId = null;
        this.msg.set(this.c.riskDetail.controlsUpdatedToast);
        this.err.set(null);
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.riskDetail.actionError),
    });
  }

  openEdit(r: Risk): void {
    this.editing.set(r);
    this.editTitle = r.title;
    this.editDescription = r.description ?? '';
    this.editCategory = r.category;
    this.editLikelihood = r.likelihood;
    this.editImpact = r.impact;
    this.editNextReviewDate = r.nextReviewDate ?? '';
  }

  closeEdit(): void {
    this.editing.set(null);
  }

  saveEdit(): void {
    const r = this.editing();
    if (!r || !this.editTitle.trim()) return;
    this.savingEdit.set(true);
    this.api.updateRisk(this.id, {
      title: this.editTitle.trim(),
      description: this.editDescription.trim() || undefined,
      category: this.editCategory,
      likelihood: this.editLikelihood,
      impact: this.editImpact,
      ownerUserId: r.ownerUserId ?? null,
      nextReviewDate: this.editNextReviewDate || null,
      controlIds: r.linkedControlIds,
    }).subscribe({
      next: (updated) => {
        this.risk.set(updated);
        this.msg.set(this.c.riskDetail.updatedToast);
        this.err.set(null);
        this.closeEdit();
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.riskDetail.actionError),
      complete: () => this.savingEdit.set(false),
    });
  }

  remove(r: Risk): void {
    if (!window.confirm(this.c.riskDetail.deleteConfirm.replace('{title}', r.title))) return;
    this.api.deleteRisk(this.id).subscribe({
      next: () => this.router.navigateByUrl('/risk-register'),
      error: (e) => this.err.set(e?.error?.message ?? this.c.riskDetail.actionError),
    });
  }
}
