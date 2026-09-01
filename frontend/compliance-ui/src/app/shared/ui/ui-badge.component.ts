import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type UiBadgeVariant =
  | 'covered' | 'partial' | 'missing' | 'needs-review'
  | 'success' | 'warning' | 'error' | 'info'
  | 'connected' | 'pending' | 'running' | 'completed' | 'failed' | 'rejected' | 'approved' | 'disconnected'
  | 'neutral';

/**
 * Universal status/label pill.
 *
 * Usage:
 *   <ui-badge variant="covered">Covered</ui-badge>
 *   <ui-badge variant="running" [dot]="true">Running</ui-badge>
 */
@Component({
  standalone: true,
  selector: 'ui-badge',
  imports: [CommonModule],
  styles: [`
    :host { display: inline-flex; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
      background: var(--color-neutral-soft);
      color: var(--color-neutral-text);
      border: 1px solid transparent;
      line-height: 1.4;
      white-space: nowrap;
    }
    .badge.dot::before {
      content: '';
      width: 6px; height: 6px;
      border-radius: var(--radius-full);
      background: currentColor;
      opacity: 0.75;
    }
    .badge.sm  { padding: 2px 8px; font-size: 11px; }

    .covered, .success, .connected, .approved, .completed {
      background: var(--color-success-soft); color: var(--color-success-text);
      border-color: var(--color-success-border);
    }
    .partial, .warning {
      background: var(--color-warning-soft); color: var(--color-warning-text);
      border-color: var(--color-warning-border);
    }
    .missing, .error, .failed, .rejected {
      background: var(--color-danger-soft); color: var(--color-danger-text);
      border-color: var(--color-danger-border);
    }
    .needs-review, .info {
      background: var(--color-info-soft); color: var(--color-info-text);
      border-color: var(--color-info-border);
    }
    .running {
      background: var(--color-primary-soft); color: var(--color-primary-text);
      border-color: #c7d2fe;
    }
    .pending, .neutral {
      background: var(--color-neutral-soft); color: var(--color-neutral-text);
      border-color: var(--color-border);
    }
    .disconnected {
      background: var(--color-neutral-soft); color: var(--color-text-muted);
      border-color: var(--color-border);
    }
  `],
  template: `
    <span class="badge {{ variant }} {{ size }}" [class.dot]="dot">
      <ng-content></ng-content>
    </span>
  `,
})
export class UiBadgeComponent {
  @Input() variant: UiBadgeVariant = 'neutral';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() dot = true;
}
