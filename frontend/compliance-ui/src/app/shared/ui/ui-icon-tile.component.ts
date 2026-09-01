import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Tinted icon-in-a-box used across cards, empty states, and step lists.
 */
@Component({
  standalone: true,
  selector: 'ui-icon-tile',
  imports: [CommonModule, MatIconModule],
  styles: [`
    :host { display: inline-flex; }
    .tile {
      display: grid; place-items: center;
      border-radius: var(--radius-lg);
      flex-shrink: 0;
      transition: all 120ms var(--ease-out);
    }
    .sm { width: 32px; height: 32px; border-radius: var(--radius-md); }
    .md { width: 44px; height: 44px; }
    .lg { width: 56px; height: 56px; border-radius: var(--radius-xl); }

    .brand   { background: var(--color-primary-soft); color: var(--color-primary); }
    .success { background: var(--color-success-soft); color: var(--color-success-text); }
    .warning { background: var(--color-warning-soft); color: var(--color-warning-text); }
    .danger  { background: var(--color-danger-soft);  color: var(--color-danger-text); }
    .info    { background: var(--color-info-soft);    color: var(--color-info-text); }
    .neutral { background: var(--color-surface-muted); color: var(--color-text-secondary); }
    .dark    { background: #0f172a; color: #fff; }
    .gradient{
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
    }

    ::ng-deep mat-icon {
      font-size: 20px; height: 20px; width: 20px;
    }
    .sm ::ng-deep mat-icon { font-size: 16px; height: 16px; width: 16px; }
    .lg ::ng-deep mat-icon { font-size: 28px; height: 28px; width: 28px; }
  `],
  template: `
    <span class="tile {{ variant }} {{ size }}">
      <mat-icon *ngIf="icon">{{ icon }}</mat-icon>
      <ng-content></ng-content>
    </span>
  `,
})
export class UiIconTileComponent {
  @Input() variant: 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'dark' | 'gradient' = 'brand';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() icon?: string;
}
