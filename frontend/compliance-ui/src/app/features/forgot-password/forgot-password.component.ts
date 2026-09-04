import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ApiService } from '../../core/api/api.service';
import { CAPTIONS } from '@captions';
import { UiButtonComponent, UiCardComponent } from '@ui';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, RouterLink, MatFormFieldModule, MatInputModule, UiButtonComponent, UiCardComponent],
  styles: [`
    :host { display: grid; place-items: center; min-height: 100vh; background: var(--color-bg); padding: 24px; }
    .wrap { width: 100%; max-width: 400px; }
    h2 { font-size: 22px; margin-bottom: 6px; letter-spacing: -0.02em; }
    .sub { color: var(--color-text-muted); font-size: 14px; margin-bottom: 20px; }
    form { display: flex; flex-direction: column; gap: 4px; }
    .actions { margin-top: 12px; }
    .foot-link { text-align: center; font-size: 13px; margin-top: 20px; }
    .success { padding: 12px 14px; background: var(--color-success-soft); border: 1px solid var(--color-success-border); border-radius: 8px; color: var(--color-success-text); font-size: 13px; }
  `],
  template: `
    <div class="wrap">
      <ui-card>
        <h2>{{ c.forgotPassword.title }}</h2>
        <p class="sub">{{ c.forgotPassword.subtitle }}</p>

        <ng-container *ngIf="!sent(); else sentBlock">
          <form (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>{{ c.forgotPassword.emailLabel }}</mat-label>
              <input matInput type="email" name="email" [(ngModel)]="email" required autocomplete="username">
            </mat-form-field>
            <div class="actions">
              <ui-button variant="primary" [loading]="loading()" [loadingText]="c.forgotPassword.submittingButton"
                         [disabled]="!email" type="submit" style="width:100%;">
                {{ c.forgotPassword.submitButton }}
              </ui-button>
            </div>
          </form>
        </ng-container>
        <ng-template #sentBlock>
          <div class="success">{{ c.forgotPassword.sentMessage }}</div>
        </ng-template>

        <div class="foot-link"><a routerLink="/login">{{ c.forgotPassword.backToLogin }}</a></div>
      </ui-card>
    </div>
  `,
})
export class ForgotPasswordComponent {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  email = '';
  loading = signal(false);
  sent = signal(false);

  submit(): void {
    this.loading.set(true);
    this.api.forgotPassword(this.email.trim()).subscribe({
      next: () => this.sent.set(true),
      error: () => this.sent.set(true), // never reveal whether the email exists
      complete: () => this.loading.set(false),
    });
  }
}
