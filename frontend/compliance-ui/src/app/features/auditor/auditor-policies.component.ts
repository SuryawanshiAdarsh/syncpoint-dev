import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '@core/api/api.service';
import { Policy } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import { UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent } from '@ui';

/** Read-only view of published policies for the invited-auditor workspace. */
@Component({
  standalone: true,
  selector: 'app-auditor-policies',
  imports: [CommonModule, UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent],
  styles: [`
    .policy-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--color-divider); }
    .policy-row:last-child { border-bottom: none; }
    .policy-row .name { font-weight: 500; }
    .policy-row .meta { color: var(--color-text-muted); font-size: 12.5px; margin-top: 2px; }
  `],
  template: `
    <div class="page">
      <ui-page-header [eyebrow]="c.auditorWorkspace.eyebrow" [title]="c.auditorWorkspace.policiesTitle"
                       [subtitle]="c.auditorWorkspace.policiesSubtitle">
      </ui-page-header>

      <ui-card style="display:block;margin-top:var(--space-4);">
        <ng-container *ngIf="policies().length; else emptyState">
          <div class="policy-row" *ngFor="let p of policies()">
            <div>
              <div class="name">{{ p.title }}</div>
              <div class="meta">{{ p.category }} \u00b7 v{{ p.currentVersion }} \u00b7 Owner: {{ p.ownerName ?? 'Unassigned' }}</div>
            </div>
          </div>
        </ng-container>
        <ng-template #emptyState>
          <ui-empty-state icon="gavel" title="No published policies" description=""></ui-empty-state>
        </ng-template>
      </ui-card>
    </div>
  `,
})
export class AuditorPoliciesComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  policies = signal<Policy[]>([]);

  ngOnInit(): void {
    this.api.auditorPolicies().subscribe(list => this.policies.set(list));
  }
}
