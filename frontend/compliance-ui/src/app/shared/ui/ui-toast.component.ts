import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Floating success / error / info notification, fixed to the bottom-right of the
 * viewport so it's always visible regardless of scroll position or how far down
 * the page it's declared (previously rendered inline, which put it below the fold
 * on any page with more than a screenful of content above it).
 *
 * Usage:
 *   <ui-toast variant="success">Evidence uploaded</ui-toast>
 *   <ui-toast variant="error">{{ error() }}</ui-toast>
 */
@Component({
  standalone: true,
  selector: 'ui-toast',
  imports: [CommonModule, MatIconModule],
  styles: [`
    :host {
      display: block;
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 1000;
      max-width: min(420px, calc(100vw - 48px));
      pointer-events: none;
    }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: var(--text-md);
      line-height: 1.5;
      border: 1px solid transparent;
      box-shadow: var(--shadow-lg, 0 10px 30px rgba(0, 0, 0, 0.18));
      pointer-events: auto;
      animation: slide-in 200ms var(--ease-out);
    }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: none; }
    }
    .toast mat-icon { font-size: 18px; height: 18px; width: 18px; flex-shrink: 0; }

    .success { background: var(--color-success-soft); border-color: var(--color-success-border); color: var(--color-success-text); }
    .error   { background: var(--color-danger-soft);  border-color: var(--color-danger-border);  color: var(--color-danger-text); }
    .warning { background: var(--color-warning-soft); border-color: var(--color-warning-border); color: var(--color-warning-text); }
    .info    { background: var(--color-primary-soft); border-color: #c7d2fe;                    color: var(--color-primary-text); }
  `],
  template: `
    <div class="toast {{ variant }}" role="status">
      <mat-icon>{{ iconFor() }}</mat-icon>
      <ng-content></ng-content>
    </div>
  `,
})
export class UiToastComponent {
  @Input() variant: 'success' | 'error' | 'warning' | 'info' = 'success';
  @Input() icon?: string;

  iconFor(): string {
    if (this.icon) return this.icon;
    return ({
      success: 'check_circle',
      error:   'error_outline',
      warning: 'warning',
      info:    'info',
    } as const)[this.variant];
  }
}
