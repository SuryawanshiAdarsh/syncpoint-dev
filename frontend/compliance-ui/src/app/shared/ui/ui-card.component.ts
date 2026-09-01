import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Standard content card.
 *
 * Usage:
 *   <ui-card [title]="'Recent evidence'" [caption]="'12 items'">
 *     <a header-actions routerLink="/evidence">See all →</a>
 *     ...body...
 *   </ui-card>
 *
 * For a flush table inside the card, add `flush` attribute.
 */
@Component({
  standalone: true,
  selector: 'ui-card',
  imports: [CommonModule],
  styles: [`
    :host { display: block; }
    .card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
      transition: box-shadow var(--transition-normal);
      overflow: hidden;
    }
    .card + .card { margin-top: var(--space-4); }
    .card.hover:hover { box-shadow: var(--shadow-md); }

    .body { padding: var(--space-6); }
    .body.tight { padding: var(--space-4); }
    .body.flush { padding: 0; }

    .head {
      display: flex; align-items: center; justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--color-divider);
    }
    .head.flush + .body { padding-top: 0; }
    .head .titles h2 { margin: 0; font-size: var(--text-xl); letter-spacing: -0.01em; }
    .head .titles .caption {
      color: var(--color-text-muted); font-size: var(--text-sm); margin-top: 2px;
    }
    .head .actions { display: flex; align-items: center; gap: var(--space-2); }
  `],
  template: `
    <div class="card" [class.hover]="hoverable">
      <div class="head" *ngIf="title">
        <div class="titles">
          <h2>{{ title }}</h2>
          <div class="caption" *ngIf="caption">{{ caption }}</div>
        </div>
        <div class="actions"><ng-content select="[header-actions]"></ng-content></div>
      </div>
      <div class="body" [class.tight]="padding === 'tight'" [class.flush]="padding === 'flush'">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class UiCardComponent {
  @Input() title?: string;
  @Input() caption?: string;
  @Input() hoverable = false;
  @Input() padding: 'normal' | 'tight' | 'flush' = 'normal';
}
