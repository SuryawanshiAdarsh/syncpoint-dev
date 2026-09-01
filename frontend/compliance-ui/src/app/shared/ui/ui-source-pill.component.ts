import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { EvidenceSourceType } from '../../core/api/api.types';

/**
 * Pill showing an evidence source with a matched icon.
 *
 * Usage:
 *   <ui-source-pill [source]="'GITHUB'"></ui-source-pill>
 */
@Component({
  standalone: true,
  selector: 'ui-source-pill',
  imports: [CommonModule, MatIconModule],
  styles: [`
    :host { display: inline-flex; }
    .pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px;
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
    .pill mat-icon { font-size: 13px; height: 13px; width: 13px; }
  `],
  template: `
    <span class="pill">
      <mat-icon>{{ icon() }}</mat-icon>{{ label() }}
    </span>
  `,
})
export class UiSourcePillComponent {
  @Input({ required: true }) set source(value: EvidenceSourceType) { this._source.set(value); }
  private readonly _source = signal<EvidenceSourceType>('MANUAL_UPLOAD');

  readonly icon = computed(() => ({
    MANUAL_UPLOAD:    'upload_file',
    GITHUB:           'code',
    AWS:              'cloud',
    JIRA:             'bug_report',
    GOOGLE_WORKSPACE: 'groups',
  } as const)[this._source()]);

  readonly label = computed(() => ({
    MANUAL_UPLOAD:    'Manual upload',
    GITHUB:           'GitHub',
    AWS:              'AWS',
    JIRA:             'Jira',
    GOOGLE_WORKSPACE: 'Google Workspace',
  } as const)[this._source()]);
}
