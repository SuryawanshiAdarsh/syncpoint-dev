import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

/**
 * Compact search input with an icon prefix.
 * Height locked at 44px so it aligns with Material outlined form fields.
 *
 * Usage:
 *   <ui-search [(value)]="search" placeholder="Search controls…" />
 */
@Component({
  standalone: true,
  selector: 'ui-search',
  imports: [CommonModule, FormsModule, MatIconModule],
  styles: [`
    :host { display: flex; flex: 1; }
    .search {
      display: flex; align-items: center;
      gap: 8px;
      padding: 0 14px;
      border-radius: var(--radius-md);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      transition: all 120ms var(--ease-out);
      width: 100%;
      height: 44px;
    }
    .search:focus-within {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-focus);
    }
    .search mat-icon {
      color: var(--color-text-muted);
      font-size: 18px; height: 18px; width: 18px;
      flex-shrink: 0;
    }
    input {
      flex: 1; border: none; outline: none; background: transparent;
      font-family: inherit; font-size: var(--text-md);
      color: var(--color-text);
      padding: 0;
    }
    input::placeholder { color: var(--color-text-muted); }

    .clear {
      background: transparent; border: none; cursor: pointer;
      color: var(--color-text-muted);
      padding: 4px; border-radius: var(--radius-sm);
      display: grid; place-items: center;
    }
    .clear:hover { background: var(--color-surface-muted); color: var(--color-text); }
    .clear mat-icon { font-size: 14px; height: 14px; width: 14px; }
  `],
  template: `
    <div class="search">
      <mat-icon>search</mat-icon>
      <input #input
             [ngModel]="value"
             (ngModelChange)="onChange($event)"
             [placeholder]="placeholder">
      <button class="clear" *ngIf="value" (click)="clear()" title="Clear">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
})
export class UiSearchComponent {
  @Input() value = '';
  @Input() placeholder = 'Search…';
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('input') input?: ElementRef<HTMLInputElement>;

  onChange(v: string): void {
    this.value = v;
    this.valueChange.emit(v);
  }
  clear(): void {
    this.onChange('');
    this.input?.nativeElement.focus();
  }
}
