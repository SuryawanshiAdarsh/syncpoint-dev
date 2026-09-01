import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Universal button. Change look-and-feel here, not on every page.
 *
 * Usage:
 *   <ui-button variant="primary" size="md" [loading]="saving()" (click)="save()">
 *     <mat-icon>upload</mat-icon>Upload evidence
 *   </ui-button>
 */
@Component({
  standalone: true,
  selector: 'ui-button',
  imports: [CommonModule, MatIconModule],
  styles: [`
    :host { display: inline-flex; }
    button {
      display: inline-flex; align-items: center; justify-content: center;
      gap: var(--space-2);
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-size: var(--text-md);
      font-weight: var(--weight-medium);
      font-family: inherit;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 120ms var(--ease-out);
      text-decoration: none;
      line-height: 1;
      min-height: 36px;
      white-space: nowrap;
    }
    button.primary {
      background: var(--color-primary);
      color: #fff;
      box-shadow: 0 1px 2px rgba(79, 70, 229, 0.25);
    }
    button.primary:hover:not(:disabled) { background: var(--color-primary-hover); }
    button.primary:active:not(:disabled) { background: var(--color-primary-active); }

    button.ghost {
      background: transparent;
      color: var(--color-text-secondary);
      border-color: var(--color-border);
    }
    button.ghost:hover:not(:disabled) {
      background: var(--color-surface-muted);
      color: var(--color-text);
    }

    button.danger {
      background: transparent;
      color: var(--color-danger-text);
      border-color: var(--color-danger-border);
    }
    button.danger:hover:not(:disabled) { background: var(--color-danger-soft); }

    button.inverse {
      background: #fff;
      color: var(--color-primary-active);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    button.inverse:hover:not(:disabled) { background: var(--color-primary-soft); }

    button.sm { padding: 4px 10px; min-height: 28px; font-size: var(--text-base); }
    button.lg { padding: 10px 20px; min-height: 44px; font-size: var(--text-lg); }

    button:disabled { opacity: 0.55; cursor: not-allowed; }
    button:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

    ::ng-deep mat-icon {
      font-size: 16px; height: 16px; width: 16px;
    }
    button.sm ::ng-deep mat-icon { font-size: 14px; height: 14px; width: 14px; }
    button.lg ::ng-deep mat-icon { font-size: 18px; height: 18px; width: 18px; }

    .spinner {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid currentColor;
      border-top-color: transparent;
      animation: spin 720ms linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  template: `
    <button [type]="type"
            [class]="variant + ' ' + size"
            [disabled]="disabled || loading">
      <span class="spinner" *ngIf="loading"></span>
      <ng-content *ngIf="!loading"></ng-content>
      <span *ngIf="loading">{{ loadingText || 'Working…' }}</span>
    </button>
  `,
})
export class UiButtonComponent {
  @Input() variant: 'primary' | 'ghost' | 'danger' | 'inverse' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() loadingText?: string;
}
