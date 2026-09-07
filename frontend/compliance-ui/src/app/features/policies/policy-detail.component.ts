import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '@core/api/api.service';
import { Policy, PolicyAcknowledgment, Member, Me, Mapping, Control } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import { UiCardComponent, UiEmptyStateComponent, UiBadgeComponent } from '@ui';

@Component({
  standalone: true,
  selector: 'app-policy-detail',
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatAutocompleteModule, MatIconModule,
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
    .hero-top { display: flex; align-items: flex-start; gap: 20px; }
    .badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .hero-top .cat {
      font-size: 12px; color: var(--color-text-secondary);
      padding: 3px 10px; background: var(--color-surface-muted);
      border: 1px solid var(--color-border); border-radius: 999px;
    }
    .hero h1 { font-size: 26px; margin: 0 0 10px 0; letter-spacing: -0.02em; line-height: 1.25; }
    .hero .desc { color: var(--color-text-secondary); font-size: 14px; line-height: 1.65; max-width: 780px; margin: 0; }

    .meta-primary {
      display: flex; gap: 36px; flex-wrap: wrap;
      margin-top: 28px; padding-top: 22px; border-top: 1px solid var(--color-divider);
    }
    .meta-primary .item { flex: 1 1 150px; min-width: 150px; }
    .meta-primary .item .label,
    .meta-controls .label {
      color: var(--color-text-muted); font-size: 11px; text-transform: uppercase;
      letter-spacing: 0.06em; margin-bottom: 7px;
    }
    .meta-primary .item .val { font-size: 14.5px; font-weight: 600; }

    .meta-controls { margin-top: 22px; }
    .meta-controls .chips { margin-bottom: 8px; }
    .meta-controls .no-controls { font-size: 14.5px; font-weight: 600; color: var(--color-text); }
    .meta-controls .view-link { font-size: 12.5px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      display: inline-flex; align-items: center;
      padding: 3px 10px; border-radius: var(--radius-full);
      background: var(--color-surface-muted); border: 1px solid var(--color-border);
      font-size: 12px; font-family: var(--font-mono); color: var(--color-text-secondary);
    }

    .mapping-list { margin-bottom: 12px; }
    .mapping-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 0; border-bottom: 1px solid var(--color-divider);
    }
    .mapping-row:last-child { border-bottom: none; }
    .mapping-row .chip.suggested { border-color: var(--color-warning-border, #fcd34d); color: var(--color-warning-text); }
    .mapping-status { font-size: 12px; color: var(--color-text-muted); }
    .mapping-status.confirmed { color: var(--color-success-text); }
    .mapping-status.suggested { color: var(--color-warning-text); }
    .mapping-row .spacer { flex: 1; }
    .mapping-row button.icon-btn {
      background: none; border: none; cursor: pointer; padding: 4px; border-radius: var(--radius-md);
      color: var(--color-text-muted); display: grid; place-items: center;
    }
    .mapping-row button.icon-btn:hover { background: var(--color-surface-muted); color: var(--color-text); }
    .mapping-row button.icon-btn mat-icon { font-size: 17px; height: 17px; width: 17px; }
    .mapping-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 4px; margin-bottom: 10px; }

    .actions-row {
      display: flex; gap: 10px; flex-wrap: wrap;
      margin-top: 28px; padding-top: 22px; border-top: 1px solid var(--color-divider);
    }

    .roster-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 12px 4px; border-bottom: 1px solid var(--color-divider);
    }
    .roster-row:last-child { border-bottom: none; }
    .roster-row .name { font-weight: 600; font-size: 14px; }
    .roster-row .email { color: var(--color-text-muted); font-size: 12.5px; margin-top: 2px; }
    .roster-row .acked-at { color: var(--color-text-muted); font-size: 12px; margin-top: 4px; text-align: right; }

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
    .modal-actions { margin-top: var(--space-4); display: flex; justify-content: flex-end; gap: 10px; }
  `],
  template: `
    <div class="page">
      <a routerLink="/policies" class="back"><mat-icon>arrow_back</mat-icon> {{ c.policyDetail.backToPolicies }}</a>

      <ng-container *ngIf="policy() as p">
        <div class="hero">
          <div class="hero-top">
            <div style="flex:1;">
              <div class="badges">
                <span class="cat">{{ p.category }}</span>
                <ui-badge *ngIf="p.status === 'ARCHIVED'" variant="neutral">{{ c.policyDetail.archivedBadge }}</ui-badge>
                <ui-badge *ngIf="isOverdue(p)" variant="warning">{{ c.policyDetail.reviewOverdueBadge }}</ui-badge>
              </div>
              <h1>{{ p.title }}</h1>
              <p class="desc" *ngIf="p.description">{{ p.description }}</p>
            </div>
          </div>

          <div class="meta-primary">
            <div class="item">
              <div class="label">{{ c.policyDetail.ownerLabel }}</div>
              <div class="val">{{ p.ownerName || c.policyDetail.noOwner }}</div>
            </div>
            <div class="item">
              <div class="label">{{ c.policyDetail.versionLabel }}</div>
              <div class="val">v{{ p.currentVersion }}</div>
            </div>
            <div class="item">
              <div class="label">{{ c.policyDetail.acknowledgedLabel }}</div>
              <div class="val">{{ p.acknowledgedCount }} / {{ p.totalMembers }}</div>
            </div>
            <div class="item">
              <div class="label">{{ c.policyDetail.nextReviewLabel }}</div>
              <div class="val">{{ p.nextReviewDate || '—' }}</div>
            </div>
          </div>

          <div class="meta-controls">
            <div class="label">{{ c.policyDetail.mappedControlsLabel }}</div>

            <div class="mapping-list" *ngIf="confirmedMappings().length || suggestedMappings().length; else noMappings">
              <div class="mapping-row" *ngFor="let m of confirmedMappings()">
                <span class="chip">{{ m.controlCode }}</span>
                <span class="mapping-status confirmed">{{ c.policyDetail.mappingConfirmed }}</span>
                <span class="spacer"></span>
                <button *ngIf="canManage()" class="icon-btn" [title]="c.policyDetail.removeMapping" (click)="removeMapping(m.id)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="mapping-row" *ngFor="let m of suggestedMappings()">
                <span class="chip suggested">{{ m.controlCode }}</span>
                <span class="mapping-status suggested">{{ c.policyDetail.mappingSuggested }}</span>
                <span class="spacer"></span>
                <ng-container *ngIf="canManage()">
                  <button class="icon-btn" [title]="c.policyDetail.confirmMapping" (click)="confirmMapping(m.id)">
                    <mat-icon>check</mat-icon>
                  </button>
                  <button class="icon-btn" [title]="c.policyDetail.removeMapping" (click)="removeMapping(m.id)">
                    <mat-icon>close</mat-icon>
                  </button>
                </ng-container>
              </div>
            </div>
            <ng-template #noMappings><div class="no-controls">{{ c.policyDetail.noMappedControls }}</div></ng-template>

            <div class="mapping-actions" *ngIf="canManage() && p.status !== 'ARCHIVED'">
              <button *ngIf="suggestedMappings().length" class="btn ghost sm" (click)="confirmAll()" [disabled]="confirmingAll()">
                {{ confirmingAll() ? c.policyDetail.confirmingAllButton : c.policyDetail.confirmAllButton }}
              </button>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" style="width:240px;">
                <mat-label>{{ c.policyDetail.addControlLabel }}</mat-label>
                <mat-select [(ngModel)]="addControlId">
                  <mat-option *ngFor="let ctl of unmappedControls()" [value]="ctl.id">{{ ctl.code }} — {{ ctl.title }}</mat-option>
                </mat-select>
              </mat-form-field>
              <button class="btn ghost sm" [disabled]="!addControlId" (click)="addMapping()">{{ c.policyDetail.addButton }}</button>
            </div>

            <a *ngIf="p.evidenceId" class="view-link" [routerLink]="['/evidence']" [queryParams]="{ highlight: p.evidenceId, fromPolicy: p.id, fromPolicyTitle: p.title }">
              {{ c.policyDetail.viewMappedEvidence }}
            </a>
          </div>

          <div class="actions-row" *ngIf="canManage() && p.status !== 'ARCHIVED'">
            <button class="btn ghost sm" (click)="versionInput.click()">
              <mat-icon>upload_file</mat-icon> {{ c.policyDetail.uploadVersionButton }}
            </button>
            <input #versionInput type="file" hidden (change)="uploadVersion(versionInput.files)">
            <button class="btn ghost sm" (click)="remind()" [disabled]="reminding()">
              <mat-icon>mail</mat-icon> {{ c.policyDetail.remindButton }}
            </button>
            <button class="btn ghost sm" (click)="openEdit(p)">
              <mat-icon>edit</mat-icon> {{ c.policyDetail.editButton }}
            </button>
            <button class="btn ghost sm" (click)="archive()">
              <mat-icon>archive</mat-icon> {{ c.policyDetail.archiveButton }}
            </button>
          </div>

          <div class="toast" *ngIf="remindMessage()"><mat-icon>check_circle</mat-icon>{{ remindMessage() }}</div>
          <div class="toast error" *ngIf="remindError()"><mat-icon>error_outline</mat-icon>{{ remindError() }}</div>
        </div>

        <ui-card [title]="c.policyDetail.rosterTitle" [caption]="c.policyDetail.rosterCaption">
          <ng-container *ngIf="roster().length; else emptyRoster">
            <div class="roster-row" *ngFor="let r of roster()">
              <div>
                <div class="name">{{ r.userName }}</div>
                <div class="email">{{ r.userEmail }}</div>
              </div>
              <div>
                <ui-badge [variant]="r.acknowledgedAt ? 'success' : 'warning'">
                  {{ r.acknowledgedAt ? c.policyDetail.statusAcknowledged : c.policyDetail.statusPending }}
                </ui-badge>
                <div class="acked-at" *ngIf="r.acknowledgedAt">{{ r.acknowledgedAt | date:'medium' }}</div>
              </div>
            </div>
          </ng-container>
          <ng-template #emptyRoster>
            <ui-empty-state icon="group" [title]="c.policyDetail.rosterEmptyTitle" [description]="c.policyDetail.rosterEmptyMessage"></ui-empty-state>
          </ng-template>
        </ui-card>
      </ng-container>

      <div class="modal-backdrop" *ngIf="editing()" (click)="closeEdit()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ c.policyDetail.editModalTitle }}</h3>
            <button class="modal-close" (click)="closeEdit()"><mat-icon>close</mat-icon></button>
          </div>
          <div class="modal-field">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.policyDetail.ownerLabel }}</mat-label>
              <mat-select [(ngModel)]="editOwnerUserId">
                <mat-option [value]="null">{{ c.policyDetail.ownerPlaceholder }}</mat-option>
                <mat-option *ngFor="let m of members()" [value]="m.userId">{{ m.name }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="modal-field">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.policyDetail.categoryLabel }}</mat-label>
              <input matInput [(ngModel)]="editCategory" [matAutocomplete]="editCategoryAuto">
              <mat-autocomplete #editCategoryAuto="matAutocomplete">
                <mat-option *ngFor="let cat of filteredCategories()" [value]="cat">{{ cat }}</mat-option>
              </mat-autocomplete>
            </mat-form-field>
          </div>
          <div class="modal-field">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.policyDetail.descriptionLabel }}</mat-label>
              <input matInput [(ngModel)]="editDescription">
            </mat-form-field>
          </div>
          <div class="modal-field">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.policyDetail.nextReviewLabel }}</mat-label>
              <input matInput type="date" [(ngModel)]="editNextReviewDate">
            </mat-form-field>
          </div>
          <div class="modal-actions">
            <button class="btn ghost" (click)="closeEdit()">{{ c.common.cancel }}</button>
            <button class="btn primary" (click)="saveEdit()">{{ c.common.save }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PolicyDetailComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  private id = '';
  me = signal<Me | null>(null);
  policy = signal<Policy | null>(null);
  roster = signal<PolicyAcknowledgment[]>([]);
  members = signal<Member[]>([]);
  mappings = signal<Mapping[]>([]);
  controls = signal<Control[]>([]);
  confirmingAll = signal(false);
  addControlId: string | null = null;
  categories = signal<string[]>([]);

  reminding = signal(false);
  remindMessage = signal<string | null>(null);
  remindError = signal<string | null>(null);

  editing = signal<Policy | null>(null);
  editOwnerUserId: string | null = null;
  editCategory = '';
  editDescription = '';
  editNextReviewDate = '';

  canManage = computed(() => {
    const role = this.me()?.role;
    return role === 'OWNER' || role === 'ADMIN';
  });

  confirmedMappings = computed(() => this.mappings().filter(m => m.mappingType === 'HUMAN_CONFIRMED'));
  suggestedMappings = computed(() => this.mappings().filter(m => m.mappingType === 'AI_SUGGESTED'));
  unmappedControls = computed(() => {
    const mappedIds = new Set(this.mappings().map(m => m.controlId));
    return this.controls().filter(ctl => !mappedIds.has(ctl.id));
  });

  ngOnInit(): void {
    this.api.me().subscribe(m => this.me.set(m));
    this.api.members().subscribe(m => this.members.set(m));
    this.api.controls().subscribe(cs => this.controls.set(cs));
    this.api.policyCategories().subscribe(cats => this.categories.set(cats));
    this.route.paramMap.subscribe(pm => {
      this.id = pm.get('id') ?? '';
      this.reload();
    });
  }

  filteredCategories(): string[] {
    const term = this.editCategory.trim().toLowerCase();
    const all = this.categories();
    return term ? all.filter(c => c.toLowerCase().includes(term)) : all;
  }

  reload(): void {
    if (!this.id) return;
    this.api.policy(this.id).subscribe(detail => {
      this.policy.set(detail.policy);
      this.roster.set(detail.roster);
      const evidenceId = detail.policy.evidenceId;
      if (evidenceId) {
        this.api.mappings(evidenceId).subscribe(m => this.mappings.set(m));
      } else {
        this.mappings.set([]);
      }
    });
  }

  isOverdue(p: Policy): boolean {
    if (!p.nextReviewDate) return false;
    return new Date(p.nextReviewDate) < new Date(new Date().toDateString());
  }

  uploadVersion(files: FileList | null): void {
    const f = files && files.length ? files[0] : null;
    if (!f) return;
    const form = new FormData();
    form.append('file', f);
    this.api.addPolicyVersion(this.id, form).subscribe(() => this.reload());
  }

  archive(): void {
    this.api.archivePolicy(this.id).subscribe(() => this.reload());
  }

  confirmMapping(mappingId: string): void {
    const evidenceId = this.policy()?.evidenceId;
    if (!evidenceId) return;
    this.api.confirmMapping(evidenceId, mappingId).subscribe(() => this.reload());
  }

  removeMapping(mappingId: string): void {
    const evidenceId = this.policy()?.evidenceId;
    if (!evidenceId) return;
    this.api.rejectMapping(evidenceId, mappingId).subscribe(() => this.reload());
  }

  confirmAll(): void {
    if (this.confirmingAll()) return;
    this.confirmingAll.set(true);
    this.api.confirmAllPolicyMappings(this.id).subscribe({
      next: () => this.reload(),
      complete: () => this.confirmingAll.set(false),
    });
  }

  addMapping(): void {
    const evidenceId = this.policy()?.evidenceId;
    if (!evidenceId || !this.addControlId) return;
    this.api.createMapping(evidenceId, {
      controlId: this.addControlId, mappingType: 'HUMAN_CONFIRMED',
      classification: 'COVERED', reason: 'Manually mapped from policy detail.',
    }).subscribe(() => {
      this.addControlId = null;
      this.reload();
    });
  }

  remind(): void {
    if (this.reminding()) return;
    this.reminding.set(true);
    this.remindError.set(null);
    this.remindMessage.set(null);
    this.api.remindPolicy(this.id).subscribe({
      next: () => this.remindMessage.set(this.c.policyDetail.remindSentToast),
      error: (e) => this.remindError.set(e?.status === 429 ? this.c.policyDetail.remindCooldownError : this.c.policyDetail.genericError),
      complete: () => this.reminding.set(false),
    });
  }

  openEdit(p: Policy): void {
    this.editing.set(p);
    this.editOwnerUserId = p.ownerUserId ?? null;
    this.editCategory = p.category;
    this.editDescription = p.description ?? '';
    this.editNextReviewDate = p.nextReviewDate ?? '';
  }

  closeEdit(): void {
    this.editing.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeEdit();
  }

  saveEdit(): void {
    const p = this.editing();
    if (!p) return;
    this.api.updatePolicy(p.id, {
      ownerUserId: this.editOwnerUserId,
      category: this.editCategory,
      description: this.editDescription || undefined,
      nextReviewDate: this.editNextReviewDate || null,
    }).subscribe(() => {
      this.closeEdit();
      this.reload();
    });
  }
}
