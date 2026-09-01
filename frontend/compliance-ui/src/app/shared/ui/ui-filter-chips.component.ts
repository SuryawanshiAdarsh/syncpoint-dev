import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UiFilterChip {
  key: string;
  label: string;
  count?: number;
  colorDot?: string;
}

/**
 * Row of filter chips. Emits the selected key ('' = all).
 *
 * Usage:
 *   <ui-filter-chips [chips]="[
 *      { key: '',        label: 'All',    count: 15 },
 *      { key: 'COVERED', label: 'Covered', count: 3, colorDot: '#10b981' },
 *   ]" [(selected)]="statusFilter" />
 */
@Component({
  standalone: true,
  selector: 'ui-filter-chips',
  imports: [CommonModule],
  styles: [`
    :host { display: block; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 12.5px;
      font-weight: var(--weight-medium);
      color: var(--color-text-secondary);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      cursor: pointer;
      transition: all 120ms var(--ease-out);
      display: inline-flex; align-items: center; gap: 6px;
      user-select: none;
      font-family: inherit;
    }
    .chip:hover:not(.active) {
      color: var(--color-text);
      border-color: var(--color-border-strong);
    }
    .chip.active {
      background: var(--color-primary-soft);
      color: var(--color-primary-text);
      border-color: #c7d2fe;
    }
    .dot { display: inline-block; }
    .count {
      background: rgba(255, 255, 255, 0.6);
      padding: 0 6px; border-radius: var(--radius-full);
      font-size: 11px; font-weight: var(--weight-semibold);
    }
    .chip.active .count { background: rgba(99, 102, 241, 0.15); }
  `],
  template: `
    <div class="chips">
      <button *ngFor="let c of chips"
              type="button"
              class="chip"
              [class.active]="selected === c.key"
              (click)="select(c.key)">
        <span class="dot" *ngIf="c.colorDot" [style.color]="c.colorDot">●</span>
        {{ c.label }}
        <span class="count" *ngIf="c.count !== undefined">{{ c.count }}</span>
      </button>
    </div>
  `,
})
export class UiFilterChipsComponent {
  @Input() chips: UiFilterChip[] = [];
  @Input() selected = '';
  @Output() selectedChange = new EventEmitter<string>();

  select(key: string): void {
    this.selected = key;
    this.selectedChange.emit(key);
  }
}
