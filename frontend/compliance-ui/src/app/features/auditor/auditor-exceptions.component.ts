import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '@core/api/api.service';
import { ControlException } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import { UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiBadgeComponent } from '@ui';

/** Read-only view of logged control exceptions/deviations for the invited-auditor workspace. */
@Component({
  standalone: true,
  selector: 'app-auditor-exceptions',
  imports: [CommonModule, UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiBadgeComponent],
  styles: [`
    .exception-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--color-divider); }
    .exception-row:last-child { border-bottom: none; }
    .exception-row .desc { font-size: 13.5px; }
    .exception-row .meta { color: var(--color-text-muted); font-size: 12px; margin-top: 3px; }
  `],
  template: `
    <div class="page">
      <ui-page-header [eyebrow]="c.auditorWorkspace.eyebrow" [title]="c.auditorWorkspace.exceptionsTitle"
                       [subtitle]="c.auditorWorkspace.exceptionsSubtitle">
      </ui-page-header>

      <ui-card style="display:block;margin-top:var(--space-4);">
        <ng-container *ngIf="exceptions().length; else emptyState">
          <div class="exception-row" *ngFor="let e of exceptions()">
            <div>
              <div class="desc">{{ e.controlCode }} \u2014 {{ e.description }}</div>
              <div class="meta">Detected {{ e.detectedDate | date:'MMM d, y' }}<span *ngIf="e.remediatedDate"> \u00b7 Remediated {{ e.remediatedDate | date:'MMM d, y' }}</span></div>
            </div>
            <ui-badge [variant]="e.status === 'OPEN' ? 'warning' : 'success'">{{ e.status }}</ui-badge>
          </div>
        </ng-container>
        <ng-template #emptyState>
          <ui-empty-state icon="fact_check" title="No exceptions logged" description=""></ui-empty-state>
        </ng-template>
      </ui-card>
    </div>
  `,
})
export class AuditorExceptionsComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  exceptions = signal<ControlException[]>([]);

  ngOnInit(): void {
    this.api.auditorControlExceptions().subscribe(list => this.exceptions.set(list));
  }
}
