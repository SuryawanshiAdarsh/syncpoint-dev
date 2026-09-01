import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Inline banner for success / error / info notifications.
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
    :host { display: block; }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: var(--text-md);
      line-height: 1.5;
      margin-top: 12px;
      border: 1px solid transparent;
      animation: slide-in 200ms var(--ease-out);
    }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(4px); }
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
