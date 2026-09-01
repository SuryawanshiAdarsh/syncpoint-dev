import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Standardized page header. All top-of-page headings should use this.
 *
 * Usage:
 *   <ui-page-header
 *      eyebrow="Compliance"
 *      title="Controls"
 *      subtitle="15 SOC 2 demo controls…">
 *     <ui-button variant="primary">New control</ui-button>
 *   </ui-page-header>
 */
@Component({
  standalone: true,
  selector: 'ui-page-header',
  imports: [CommonModule],
  styles: [`
    :host { display: block; margin-bottom: var(--space-8); }
    .head {
      display: flex; align-items: flex-end; justify-content: space-between;
      gap: var(--space-6); flex-wrap: wrap;
    }
    .eyebrow {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: var(--space-2);
    }
    h1 {
      font-size: var(--text-3xl);
      letter-spacing: -0.02em;
      margin: 0;
    }
    .subtitle {
      color: var(--color-text-secondary);
      font-size: var(--text-md);
      margin-top: var(--space-2);
      max-width: 640px;
      line-height: 1.55;
    }
    .actions { display: flex; align-items: center; gap: var(--space-2); }
  `],
  template: `
    <div class="head">
      <div>
        <div class="eyebrow" *ngIf="eyebrow">{{ eyebrow }}</div>
        <h1>{{ title }}</h1>
        <p class="subtitle" *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div class="actions"><ng-content></ng-content></div>
    </div>
  `,
})
export class UiPageHeaderComponent {
  @Input() eyebrow?: string;
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
