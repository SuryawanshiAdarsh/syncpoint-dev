import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { IntegrationProvider } from './provider.types';

/**
 * Branded logo tile for an integration provider.
 * One place to swap SVGs / colours across every provider surface.
 */
@Component({
  standalone: true,
  selector: 'ui-provider-logo',
  imports: [CommonModule, MatIconModule],
  styles: [`
    :host { display: inline-flex; }
    .logo {
      display: grid; place-items: center;
      border-radius: var(--radius-md);
      flex-shrink: 0;
    }
    .md { width: 44px; height: 44px; }
    .lg { width: 56px; height: 56px; border-radius: var(--radius-lg); }
    .github { background: #0f172a; color: #fff; }
    .aws    { background: #232f3e; color: #ff9900; }
    .jira   { background: #0052cc; color: #fff; }
    .google { background: #fff; color: #4285f4; border: 1px solid var(--color-border); }

    .logo svg { width: 22px; height: 22px; }
    .lg .logo svg { width: 26px; height: 26px; }
    ::ng-deep mat-icon { font-size: 22px; height: 22px; width: 22px; }
    .lg ::ng-deep mat-icon { font-size: 26px; height: 26px; width: 26px; }
  `],
  template: `
    <span class="logo {{ providerClass() }} {{ size }}">
      <!-- GitHub Octocat -->
      <svg *ngIf="provider === 'GITHUB'" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6a4.7 4.7 0 0 1 1.3-3.3 4.4 4.4 0 0 1 .1-3.2s1-.3 3.4 1.3a11.6 11.6 0 0 1 6.2 0c2.4-1.6 3.4-1.3 3.4-1.3.7 1.7.2 3 .1 3.2a4.7 4.7 0 0 1 1.3 3.3c0 4.7-2.9 5.7-5.5 6 .5.4.9 1.1.9 2.2v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3"/>
      </svg>
      <mat-icon *ngIf="provider === 'AWS'">cloud</mat-icon>
      <mat-icon *ngIf="provider === 'JIRA'">bug_report</mat-icon>
      <mat-icon *ngIf="provider === 'GOOGLE_WORKSPACE'">groups</mat-icon>
    </span>
  `,
})
export class UiProviderLogoComponent {
  @Input({ required: true }) provider!: IntegrationProvider;
  @Input() size: 'md' | 'lg' = 'md';

  providerClass(): string {
    return ({
      GITHUB: 'github',
      AWS: 'aws',
      JIRA: 'jira',
      GOOGLE_WORKSPACE: 'google',
    } as const)[this.provider];
  }
}
