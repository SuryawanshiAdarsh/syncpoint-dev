import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ApiService } from '../../core/api/api.service';
import { CAPTIONS } from '@captions';
import { UiButtonComponent, UiCardComponent } from '@ui';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule, RouterLink, MatFormFieldModule, MatInputModule, UiButtonComponent, UiCardComponent],
  styles: [`
    :host { display: grid; place-items: center; min-height: 100vh; background: var(--color-bg); padding: 24px; }
    .wrap { width: 100%; max-width: 400px; }
    h2 { font-size: 22px; margin-bottom: 6px; letter-spacing: -0.02em; }
    .sub { color: var(--color-text-muted); font-size: 14px; margin-bottom: 20px; }
    form { display: flex; flex-direction: column; gap: 4px; }
    .actions { margin-top: 12px; }
    .success { padding: 12px 14px; background: var(--color-success-soft); border: 1px solid var(--color-success-border); border-radius: 8px; color: var(--color-success-text); font-size: 13px; }
    .invalid { padding: 12px 14px; background: var(--color-danger-soft); border: 1px solid var(--color-danger-border); border-radius: 8px; color: var(--color-danger-text); font-size: 13px; }
    .foot-link { text-align: center; font-size: 13px; margin-top: 20px; }
  `],
  template: `
    <div class="wrap">
      <ui-card>
        <ng-container [ngSwitch]="state()">
          <ng-container *ngSwitchCase="'form'">
            <h2>{{ c.resetPassword.title }}</h2>
            <p class="sub">{{ c.resetPassword.subtitle }}</p>
            <form (ngSubmit)="submit()">
              <mat-form-field appearance="outline">
                <mat-label>{{ c.resetPassword.passwordLabel }}</mat-label>
                <input matInput type="password" name="password" [(ngModel)]="password" required minlength="12" autocomplete="new-password">
              </mat-form-field>
              <div class="actions">
                <ui-button variant="primary" [loading]="loading()" [loadingText]="c.resetPassword.submittingButton"
                           [disabled]="password.length < 12" type="submit" style="width:100%;">
                  {{ c.resetPassword.submitButton }}
                </ui-button>
              </div>
            </form>
          </ng-container>

          <ng-container *ngSwitchCase="'success'">
            <div class="success">{{ c.resetPassword.successMessage }}</div>
            <div class="foot-link"><a routerLink="/login">{{ c.resetPassword.goToLogin }}</a></div>
          </ng-container>

          <ng-container *ngSwitchCase="'invalid'">
            <div class="invalid">{{ c.resetPassword.invalidMessage }}</div>
            <div class="foot-link"><a routerLink="/forgot-password">{{ c.forgotPassword.title }}</a></div>
          </ng-container>
        </ng-container>
      </ui-card>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  private token = '';
  password = '';
  loading = signal(false);
  state = signal<'form' | 'success' | 'invalid'>('form');

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) this.state.set('invalid');
  }

  submit(): void {
    this.loading.set(true);
    this.api.resetPassword(this.token, this.password).subscribe({
      next: () => this.state.set('success'),
      error: () => this.state.set('invalid'),
      complete: () => this.loading.set(false),
    });
  }
}
