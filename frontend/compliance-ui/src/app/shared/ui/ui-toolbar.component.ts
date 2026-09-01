import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Toolbar row for a page (search on the left, filters/actions on the right).
 *
 * Every child has a common baseline height so filters never sit at different
 * y-positions from the search box. Change the height in one place here.
 *
 * Usage:
 *   <ui-toolbar>
 *     <ui-search leading [(value)]="search" />
 *     <mat-form-field trailing appearance="outline" subscriptSizing="dynamic">
 *       ...
 *     </mat-form-field>
 *   </ui-toolbar>
 */
@Component({
  standalone: true,
  selector: 'ui-toolbar',
  imports: [CommonModule],
  styles: [`
    :host { display: block; margin-bottom: var(--space-4); }
    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }
    /* Force all mat-form-fields in the toolbar to match ui-search height. */
    ::ng-deep .toolbar .mat-mdc-form-field {
      --mdc-outlined-text-field-container-shape: 8px;
    }
    ::ng-deep .toolbar .mat-mdc-form-field .mat-mdc-text-field-wrapper { height: 44px; }
    ::ng-deep .toolbar .mat-mdc-form-field .mat-mdc-form-field-flex { align-items: center; height: 44px; }
    ::ng-deep .toolbar .mat-mdc-form-field .mat-mdc-form-field-infix {
      padding-top: 10px !important;
      padding-bottom: 10px !important;
      min-height: unset;
    }
    ::ng-deep .toolbar .mat-mdc-form-field .mdc-notched-outline__notch {
      padding-top: 0; padding-bottom: 0;
    }

    .leading  { flex: 1; min-width: 260px; }
    .trailing { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
  `],
  template: `
    <div class="toolbar">
      <div class="leading"><ng-content select="[leading]"></ng-content></div>
      <div class="trailing"><ng-content select="[trailing]"></ng-content></div>
    </div>
  `,
})
export class UiToolbarComponent {}
