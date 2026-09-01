import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { UiIconTileComponent } from './ui-icon-tile.component';

/**
 * Empty-state block for tables and lists.
 *
 * Usage:
 *   <ui-empty-state icon="upload_file"
 *                   title="No evidence uploaded yet"
 *                   description="Drop a file above or connect an integration.">
 *     <ui-button variant="primary">Upload</ui-button>
 *   </ui-empty-state>
 */
@Component({
  standalone: true,
  selector: 'ui-empty-state',
  imports: [CommonModule, MatIconModule, UiIconTileComponent],
  styles: [`
    :host { display: block; }
    .wrap {
      padding: var(--space-10) var(--space-6);
      text-align: center;
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-2);
    }
    h3 { color: var(--color-text); margin: 8px 0 0 0; font-size: var(--text-lg); }
    p  { color: var(--color-text-muted); max-width: 420px; margin: 0; }
    .actions { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
  `],
  template: `
    <div class="wrap">
      <ui-icon-tile [icon]="icon" [variant]="iconVariant" size="md"></ui-icon-tile>
      <h3>{{ title }}</h3>
      <p *ngIf="description">{{ description }}</p>
      <div class="actions"><ng-content></ng-content></div>
    </div>
  `,
})
export class UiEmptyStateComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input() description?: string;
  @Input() iconVariant: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'brand';
}
