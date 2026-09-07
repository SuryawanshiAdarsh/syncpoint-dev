import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '@core/api/api.service';
import { PolicyPortalItem, PolicyPortalDetail } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import { UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiEmptyStateComponent } from '@ui';

const PAGE_SIZE = 10;

/** Real-login counterpart to the magic-link policy-portal page — same UX, backed by the normal
 *  authenticated session instead of a token. See policy-portal.component.ts for the public route. */
@Component({
  standalone: true,
  selector: 'app-my-policies',
  imports: [CommonModule, MatIconModule, UiPageHeaderComponent, UiCardComponent, UiBadgeComponent, UiEmptyStateComponent],
  styles: [`
    .row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 14px 4px; border-bottom: 1px solid var(--color-divider); cursor: pointer;
    }
    .row:last-child { border-bottom: none; }
    .row:hover { background: var(--color-surface-muted); }
    .row .title { font-weight: 600; font-size: 14px; }
    .row .category { color: var(--color-text-muted); font-size: 12.5px; margin-top: 2px; }
    .pager { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 14px 4px; }

    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;
    }
    .modal-card {
      background: var(--color-surface); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);
      max-width: 540px; width: 100%; max-height: 80vh; overflow-y: auto; padding: 24px;
    }
    .modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
    .modal-title { font-size: 18px; font-weight: 650; margin: 0; }
    .modal-close { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: 8px; }
    .modal-close:hover { background: var(--color-surface-muted); }
    .modal-description { color: var(--color-text-secondary); font-size: 13.5px; line-height: 1.6; white-space: pre-wrap; margin-bottom: 16px; }
    .modal-doc-link {
      display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; margin-bottom: 20px;
      background: none; border: none; cursor: pointer; color: var(--color-primary); padding: 0;
    }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .already-acked { display: flex; align-items: center; gap: 8px; color: var(--color-success-text); font-size: 13.5px; }
    .err { color: var(--color-danger-text); font-size: 13px; margin-top: 10px; }
  `],
  template: `
    <div class="page">
      <ui-page-header [eyebrow]="c.myPolicies.eyebrow" [title]="c.myPolicies.title" [subtitle]="c.myPolicies.subtitle"></ui-page-header>

      <ui-card>
        <ng-container *ngIf="items().length; else emptyState">
          <div class="row" *ngFor="let item of items()" (click)="openDetail(item)">
            <div>
              <div class="title">{{ item.title }}</div>
              <div class="category">{{ item.category }}</div>
            </div>
            <ui-badge [variant]="item.status === 'ACKNOWLEDGED' ? 'success' : 'warning'">
              {{ item.status === 'ACKNOWLEDGED' ? c.myPolicies.statusAcknowledged : c.myPolicies.statusPending }}
            </ui-badge>
          </div>
        </ng-container>
        <ng-template #emptyState>
          <ui-empty-state icon="task_alt" [title]="c.myPolicies.emptyTitle" [description]="c.myPolicies.emptyMessage"></ui-empty-state>
        </ng-template>

        <div class="pager" *ngIf="totalPages() > 1">
          <button class="btn ghost sm" (click)="prevPage()" [disabled]="page() === 0">{{ c.myPolicies.pagePrev }}</button>
          <span class="muted small">{{ c.myPolicies.pageIndicator(page() + 1, totalPages()) }}</span>
          <button class="btn ghost sm" (click)="nextPage()" [disabled]="page() >= totalPages() - 1">{{ c.myPolicies.pageNext }}</button>
        </div>
      </ui-card>

      <div class="modal-backdrop" *ngIf="selected()" (click)="closeDetail()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ selected()?.title }}</h3>
            <button class="modal-close" (click)="closeDetail()"><mat-icon>close</mat-icon></button>
          </div>
          <p class="modal-description" *ngIf="selected()?.description">{{ selected()?.description }}</p>
          <button class="modal-doc-link" *ngIf="selected()?.hasDocument" (click)="viewDocument()">
            <mat-icon style="font-size:18px;height:18px;width:18px;">description</mat-icon>{{ c.myPolicies.viewDocument }}
          </button>
          <div class="modal-actions">
            <div class="already-acked" *ngIf="selected()?.status === 'ACKNOWLEDGED'">
              <mat-icon style="font-size:18px;height:18px;width:18px;">check_circle</mat-icon>{{ c.myPolicies.alreadyAcknowledged }}
            </div>
            <button *ngIf="selected()?.status !== 'ACKNOWLEDGED'" class="btn primary" (click)="acknowledge()" [disabled]="acknowledging()">
              {{ acknowledging() ? c.myPolicies.acknowledgingButton : c.myPolicies.acknowledgeButton }}
            </button>
          </div>
          <div class="err" *ngIf="ackError()">{{ ackError() }}</div>
        </div>
      </div>
    </div>
  `,
})
export class MyPoliciesComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  items = signal<PolicyPortalItem[]>([]);
  page = signal(0);
  totalPages = signal(1);

  selected = signal<PolicyPortalDetail | null>(null);
  acknowledging = signal(false);
  ackError = signal<string | null>(null);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.api.myPolicies(this.page(), PAGE_SIZE).subscribe(res => {
      this.items.set(res.items);
      this.totalPages.set(res.totalPages);
    });
  }

  prevPage(): void { this.page.update(p => Math.max(0, p - 1)); this.reload(); }
  nextPage(): void { this.page.update(p => Math.min(this.totalPages() - 1, p + 1)); this.reload(); }

  openDetail(item: PolicyPortalItem): void {
    this.ackError.set(null);
    this.api.myPolicy(item.id).subscribe(detail => this.selected.set(detail));
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  viewDocument(): void {
    const s = this.selected();
    if (!s) return;
    this.api.myPolicyDocumentBlob(s.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  }

  acknowledge(): void {
    const s = this.selected();
    if (!s) return;
    this.acknowledging.set(true);
    this.ackError.set(null);
    this.api.acknowledgeMyPolicy(s.id).subscribe({
      next: () => {
        this.selected.set({ ...s, status: 'ACKNOWLEDGED' });
        this.reload();
      },
      error: (e) => this.ackError.set(e?.error?.message ?? this.c.myPolicies.genericError),
      complete: () => this.acknowledging.set(false),
    });
  }
}
