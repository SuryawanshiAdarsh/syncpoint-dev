import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ApiService } from '@core/api/api.service';
import { Control } from '@core/api/api.types';
import { CAPTIONS } from '@captions';
import { UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiControlStatusBadgeComponent } from '@ui';

/** Read-only control list for the invited-auditor workspace — clicking a row opens the detail page. */
@Component({
  standalone: true,
  selector: 'app-auditor-controls',
  imports: [CommonModule, RouterLink, UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiControlStatusBadgeComponent],
  styles: [`
    .data-table { width: 100%; table-layout: fixed; }
    .data-row { cursor: pointer; }
    .code { font-family: var(--font-mono); font-weight: var(--weight-medium); }
    .title-cell .desc { color: var(--color-text-muted); font-size: 12.5px; margin-top: 2px; }
  `],
  template: `
    <div class="page">
      <ui-page-header [eyebrow]="c.auditorWorkspace.eyebrow" [title]="c.auditorWorkspace.controlsTitle"
                       [subtitle]="c.auditorWorkspace.controlsSubtitle">
      </ui-page-header>

      <ui-card padding="flush" style="display:block;margin-top:var(--space-4);">
        <table class="data-table" *ngIf="controls().length; else emptyState">
          <colgroup><col style="width:14%"><col style="width:46%"><col style="width:20%"><col style="width:20%"></colgroup>
          <thead><tr>
            <th>{{ c.auditorWorkspace.tableCode }}</th>
            <th>{{ c.auditorWorkspace.tableTitle }}</th>
            <th>{{ c.auditorWorkspace.tableCategory }}</th>
            <th>{{ c.auditorWorkspace.tableStatus }}</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let ctrl of controls()" class="data-row" [routerLink]="['/auditor/controls', ctrl.id]">
              <td class="code">{{ ctrl.code }}</td>
              <td class="title-cell">
                <div>{{ ctrl.title }}</div>
                <div class="desc">{{ ctrl.description }}</div>
              </td>
              <td>{{ ctrl.category }}</td>
              <td><ui-control-status-badge [status]="ctrl.status"></ui-control-status-badge></td>
            </tr>
          </tbody>
        </table>
        <ng-template #emptyState>
          <ui-empty-state icon="checklist" title="No controls in scope" description=""></ui-empty-state>
        </ng-template>
      </ui-card>
    </div>
  `,
})
export class AuditorControlsComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  controls = signal<Control[]>([]);

  ngOnInit(): void {
    this.api.auditorControls().subscribe(list => this.controls.set(list));
  }
}
