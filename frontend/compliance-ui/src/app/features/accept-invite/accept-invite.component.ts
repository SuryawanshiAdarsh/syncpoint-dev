import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ApiService } from '../../core/api/api.service';
import { TokenStore } from '../../core/auth/token-store.service';
import { CAPTIONS } from '@captions';
import { UiButtonComponent, UiCardComponent } from '@ui';

@Component({
  standalone: true,
  selector: 'app-accept-invite',
  imports: [CommonModule, FormsModule, RouterLink, MatFormFieldModule, MatInputModule, UiButtonComponent, UiCardComponent],
  styles: [`
    :host { display: grid; place-items: center; min-height: 100vh; background: var(--color-bg); padding: 24px; }
    .wrap { width: 100%; max-width: 400px; }
    h2 { font-size: 22px; margin-bottom: 6px; letter-spacing: -0.02em; }
    .sub { color: var(--color-text-muted); font-size: 14px; margin-bottom: 20px; }
    form { display: flex; flex-direction: column; gap: 4px; }
    .actions { margin-top: 12px; }
    .invalid { padding: 12px 14px; background: var(--color-danger-soft); border: 1px solid var(--color-danger-border); border-radius: 8px; color: var(--color-danger-text); font-size: 13px; }
    .foot-link { text-align: center; font-size: 13px; margin-top: 20px; }
  `],
  template: `
    <div class="wrap">
      <ui-card>
        <ng-container *ngIf="valid(); else invalidBlock">
          <h2>{{ c.acceptInvite.title }}</h2>
          <p class="sub">{{ c.acceptInvite.subtitle }}</p>
          <form (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>{{ c.acceptInvite.passwordLabel }}</mat-label>
              <input matInput type="password" name="password" [(ngModel)]="password" required minlength="12" autocomplete="new-password">
            </mat-form-field>
            <div class="actions">
              <ui-button variant="primary" [loading]="loading()" [loadingText]="c.acceptInvite.submittingButton"
                         [disabled]="password.length < 12" type="submit" style="width:100%;">
                {{ c.acceptInvite.submitButton }}
              </ui-button>
            </div>
          </form>
        </ng-container>
        <ng-template #invalidBlock>
          <div class="invalid">{{ c.acceptInvite.invalidMessage }}</div>
          <div class="foot-link"><a routerLink="/login">{{ c.forgotPassword.backToLogin }}</a></div>
        </ng-template>
      </ui-card>
    </div>
  `,
})
export class AcceptInviteComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(TokenStore);

  private token = '';
  password = '';
  loading = signal(false);
  valid = signal(true);

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) this.valid.set(false);
  }

  submit(): void {
    this.loading.set(true);
    this.api.acceptInvite(this.token, this.password).subscribe({
      next: (t) => {
        this.store.setTokens(t.accessToken, t.refreshToken);
        this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      },
      error: () => { this.valid.set(false); this.loading.set(false); },
    });
  }
}
