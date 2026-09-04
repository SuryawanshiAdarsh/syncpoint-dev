import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '../../core/api/api.service';
import { CAPTIONS } from '@captions';
import { UiButtonComponent, UiCardComponent } from '@ui';

@Component({
  standalone: true,
  selector: 'app-verify-email',
  imports: [CommonModule, RouterLink, MatIconModule, UiButtonComponent, UiCardComponent],
  styles: [`
    :host { display: grid; place-items: center; min-height: 100vh; background: var(--color-bg); padding: 24px; }
    .wrap { width: 100%; max-width: 400px; text-align: center; }
    .icon { font-size: 40px; height: 40px; width: 40px; margin-bottom: 12px; }
    .icon.ok { color: var(--color-success); }
    .icon.err { color: var(--color-danger); }
    h2 { font-size: 20px; margin-bottom: 6px; }
    .sub { color: var(--color-text-muted); font-size: 14px; margin-bottom: 20px; }
  `],
  template: `
    <div class="wrap">
      <ui-card>
        <ng-container [ngSwitch]="state()">
          <ng-container *ngSwitchCase="'checking'">
            <p class="sub">{{ c.verifyEmail.verifying }}</p>
          </ng-container>
          <ng-container *ngSwitchCase="'success'">
            <mat-icon class="icon ok">check_circle</mat-icon>
            <h2>{{ c.verifyEmail.successTitle }}</h2>
            <p class="sub">{{ c.verifyEmail.successMessage }}</p>
            <a routerLink="/dashboard"><ui-button variant="primary">{{ c.verifyEmail.goToDashboard }}</ui-button></a>
          </ng-container>
          <ng-container *ngSwitchCase="'invalid'">
            <mat-icon class="icon err">error</mat-icon>
            <h2>{{ c.verifyEmail.invalidTitle }}</h2>
            <p class="sub">{{ c.verifyEmail.invalidMessage }}</p>
          </ng-container>
        </ng-container>
      </ui-card>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  state = signal<'checking' | 'success' | 'invalid'>('checking');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.state.set('invalid'); return; }
    this.api.verifyEmail(token).subscribe({
      next: () => this.state.set('success'),
      error: () => this.state.set('invalid'),
    });
  }
}
