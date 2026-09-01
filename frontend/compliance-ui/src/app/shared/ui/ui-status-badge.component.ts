import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiBadgeComponent, UiBadgeVariant } from './ui-badge.component';
import { ControlStatus, EvidenceStatus } from '../../core/api/api.types';

/**
 * Specialized badge for control readiness state.
 * One place to change label text or colour mapping across the whole app.
 */
@Component({
  standalone: true,
  selector: 'ui-control-status-badge',
  imports: [CommonModule, UiBadgeComponent],
  template: `<ui-badge [variant]="variant()">{{ label() }}</ui-badge>`,
})
export class UiControlStatusBadgeComponent {
  @Input({ required: true }) set status(value: ControlStatus) { this._status.set(value); }

  private readonly _status = signal<ControlStatus>('MISSING');

  readonly variant = computed<UiBadgeVariant>(() => {
    return ({
      COVERED: 'covered',
      PARTIAL: 'partial',
      MISSING: 'missing',
      NEEDS_REVIEW: 'needs-review',
    } as const)[this._status()];
  });

  readonly label = computed(() => {
    return ({
      COVERED: 'Covered',
      PARTIAL: 'Partial',
      MISSING: 'Missing',
      NEEDS_REVIEW: 'Needs review',
    } as const)[this._status()];
  });
}

/**
 * Specialized badge for evidence lifecycle state.
 */
@Component({
  standalone: true,
  selector: 'ui-evidence-status-badge',
  imports: [CommonModule, UiBadgeComponent],
  template: `<ui-badge [variant]="variant()">{{ label() }}</ui-badge>`,
})
export class UiEvidenceStatusBadgeComponent {
  @Input({ required: true }) set status(value: EvidenceStatus) { this._status.set(value); }

  private readonly _status = signal<EvidenceStatus>('COLLECTED');

  readonly variant = computed<UiBadgeVariant>(() => {
    return ({
      COLLECTED:    'pending',
      UNDER_REVIEW: 'running',
      APPROVED:     'approved',
      REJECTED:     'rejected',
      EXPIRED:      'error',
    } as const)[this._status()];
  });

  readonly label = computed(() => {
    return ({
      COLLECTED:    'Collected',
      UNDER_REVIEW: 'Under review',
      APPROVED:     'Approved',
      REJECTED:     'Rejected',
      EXPIRED:      'Expired',
    } as const)[this._status()];
  });
}

/**
 * Specialized badge for freshness state.
 */
@Component({
  standalone: true,
  selector: 'ui-freshness-badge',
  imports: [CommonModule, UiBadgeComponent],
  template: `<ui-badge [variant]="variant()">{{ label() }}</ui-badge>`,
})
export class UiFreshnessBadgeComponent {
  @Input({ required: true }) set freshness(value: 'CURRENT' | 'EXPIRING' | 'EXPIRED') {
    this._value.set(value);
  }
  private readonly _value = signal<'CURRENT' | 'EXPIRING' | 'EXPIRED'>('CURRENT');

  readonly variant = computed<UiBadgeVariant>(() => {
    return ({ CURRENT: 'covered', EXPIRING: 'partial', EXPIRED: 'missing' } as const)[this._value()];
  });

  readonly label = computed(() => {
    return ({ CURRENT: 'Current', EXPIRING: 'Expiring', EXPIRED: 'Expired' } as const)[this._value()];
  });
}
