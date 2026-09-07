import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '@core/api/api.service';
import { PolicyPortalItem, PolicyPortalDetail } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import { UiCardComponent, UiBadgeComponent, UiEmptyStateComponent } from '@ui';

const PAGE_SIZE = 10;

/**
 * Login-free policy acknowledgment portal. Rendered as a standalone public route (no shell,
 * no nav) so there is structurally nothing else reachable from here besides this list, the
 * detail modal, and the acknowledge action — matching the token's narrow backend permissions.
 */
@Component({
  standalone: true,
  selector: 'app-policy-portal',
  imports: [CommonModule, MatIconModule, UiCardComponent, UiBadgeComponent, UiEmptyStateComponent],
  styles: [`
    :host { display: block; min-height: 100vh; background: var(--color-bg); padding: 40px 24px; }
    .wrap { max-width: 720px; margin: 0 auto; }
    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .brand .name { font-weight: 700; font-size: 18px; }
    h1 { font-size: 22px; margin: 0 0 4px 0; letter-spacing: -0.02em; }
    .sub { color: var(--color-text-muted); font-size: 14px; margin-bottom: 20px; }
    .invalid { padding: 14px 16px; background: var(--color-danger-soft); border: 1px solid var(--color-danger-border); border-radius: 8px; color: var(--color-danger-text); font-size: 13.5px; }

    .row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 14px 4px; border-bottom: 1px solid var(--color-divider);
      cursor: pointer;
    }
    .row:last-child { border-bottom: none; }
    .row:hover { background: var(--color-surface-muted); }
    .row .title { font-weight: 600; font-size: 14px; }
    .row .category { color: var(--color-text-muted); font-size: 12.5px; margin-top: 2px; }

    .pager { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 14px 4px; }
    .done { text-align: center; color: var(--color-text-muted); font-size: 13px; margin-top: 24px; }

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
    .modal-doc-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; margin-bottom: 20px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .already-acked { display: flex; align-items: center; gap: 8px; color: var(--color-success-text); font-size: 13.5px; }
    .err { color: var(--color-danger-text); font-size: 13px; margin-top: 10px; }
  `],
  template: `
    <div class="wrap">
      <div class="brand">
        <img src="/assets/logo.svg" width="28" height="28" alt="">
        <span class="name">{{ c.common.appName }}</span>
      </div>

      <ng-container *ngIf="!token(); else hasToken">
        <div class="invalid">{{ c.policyPortal.invalidLinkTitle }} — {{ c.policyPortal.invalidLinkMessage }}</div>
      </ng-container>

      <ng-template #hasToken>
        <h1>{{ c.policyPortal.title }}</h1>
        <p class="sub">{{ c.policyPortal.subtitle }}</p>

        <div class="invalid" *ngIf="loadError()">{{ c.policyPortal.invalidLinkTitle }} — {{ c.policyPortal.invalidLinkMessage }}</div>

        <ui-card *ngIf="!loadError()">
          <ng-container *ngIf="items().length; else emptyState">
            <div class="row" *ngFor="let item of items()" (click)="openDetail(item)">
              <div>
                <div class="title">{{ item.title }}</div>
                <div class="category">{{ item.category }}</div>
              </div>
              <ui-badge [variant]="item.status === 'ACKNOWLEDGED' ? 'success' : 'warning'">
                {{ item.status === 'ACKNOWLEDGED' ? c.policyPortal.statusAcknowledged : c.policyPortal.statusPending }}
              </ui-badge>
            </div>
          </ng-container>
          <ng-template #emptyState>
            <ui-empty-state icon="task_alt" [title]="c.policyPortal.emptyTitle" [description]="c.policyPortal.emptyMessage"></ui-empty-state>
          </ng-template>

          <div class="pager" *ngIf="totalPages() > 1">
            <button class="btn ghost sm" (click)="prevPage()" [disabled]="page() === 0">{{ c.policyPortal.pagePrev }}</button>
            <span class="muted small">{{ c.policyPortal.pageIndicator(page() + 1, totalPages()) }}</span>
            <button class="btn ghost sm" (click)="nextPage()" [disabled]="page() >= totalPages() - 1">{{ c.policyPortal.pageNext }}</button>
          </div>
        </ui-card>

        <div class="done">{{ c.policyPortal.doneMessage }}</div>
      </ng-template>

      <div class="modal-backdrop" *ngIf="selected()" (click)="closeDetail()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ selected()?.title }}</h3>
            <button class="modal-close" (click)="closeDetail()"><mat-icon>close</mat-icon></button>
          </div>
          <p class="modal-description" *ngIf="selected()?.description">{{ selected()?.description }}</p>
          <a class="modal-doc-link" *ngIf="selected()?.hasDocument" [href]="documentUrl()" target="_blank" rel="noopener">
            <mat-icon style="font-size:18px;height:18px;width:18px;">description</mat-icon>{{ c.policyPortal.viewDocument }}
          </a>
          <div class="modal-actions">
            <div class="already-acked" *ngIf="selected()?.status === 'ACKNOWLEDGED'">
              <mat-icon style="font-size:18px;height:18px;width:18px;">check_circle</mat-icon>{{ c.policyPortal.alreadyAcknowledged }}
            </div>
            <button *ngIf="selected()?.status !== 'ACKNOWLEDGED'" class="btn primary" (click)="acknowledge()" [disabled]="acknowledging()">
              {{ acknowledging() ? c.policyPortal.acknowledgingButton : c.policyPortal.acknowledgeButton }}
            </button>
          </div>
          <div class="err" *ngIf="ackError()">{{ ackError() }}</div>
        </div>
      </div>
    </div>
  `,
})
export class PolicyPortalComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  token = signal<string | null>(null);
  items = signal<PolicyPortalItem[]>([]);
  page = signal(0);
  totalPages = signal(1);
  loadError = signal(false);

  selected = signal<PolicyPortalDetail | null>(null);
  acknowledging = signal(false);
  ackError = signal<string | null>(null);

  documentUrl = computed(() => {
    const t = this.token();
    const s = this.selected();
    return t && s ? this.api.portalDocumentUrl(t, s.id) : '';
  });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    this.token.set(token);
    if (token) this.reload();
  }

  reload(): void {
    const token = this.token();
    if (!token) return;
    this.api.portalPolicies(token, this.page(), PAGE_SIZE).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.totalPages.set(res.totalPages);
        this.loadError.set(false);
      },
      error: () => this.loadError.set(true),
    });
  }

  prevPage(): void { this.page.update(p => Math.max(0, p - 1)); this.reload(); }
  nextPage(): void { this.page.update(p => Math.min(this.totalPages() - 1, p + 1)); this.reload(); }

  openDetail(item: PolicyPortalItem): void {
    const token = this.token();
    if (!token) return;
    this.ackError.set(null);
    this.api.portalPolicy(token, item.id).subscribe(detail => this.selected.set(detail));
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  acknowledge(): void {
    const token = this.token();
    const s = this.selected();
    if (!token || !s) return;
    this.acknowledging.set(true);
    this.ackError.set(null);
    this.api.portalAcknowledge(token, s.id).subscribe({
      next: () => {
        this.selected.set({ ...s, status: 'ACKNOWLEDGED' });
        this.reload();
      },
      error: (e) => this.ackError.set(e?.error?.message ?? this.c.policyPortal.genericError),
      complete: () => this.acknowledging.set(false),
    });
  }
}
