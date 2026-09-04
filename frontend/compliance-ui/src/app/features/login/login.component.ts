import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '../../core/api/api.service';
import { TokenStore } from '../../core/auth/token-store.service';
import { CAPTIONS } from '@captions';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink,
            MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  styles: [`
    :host { display: block; height: 100vh; }
    .auth { display: grid; grid-template-columns: 1.1fr 1fr; min-height: 100vh; }
    @media (max-width: 900px) { .auth { grid-template-columns: 1fr; } .hero { display: none; } }

    .hero {
      background: linear-gradient(135deg, #0b1220 0%, #1e1b4b 55%, #4c1d95 100%);
      color: #fff;
      padding: 56px 64px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute; inset: 0;
      background:
        radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.25), transparent 50%),
        radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.20), transparent 55%);
      pointer-events: none;
    }
    .hero > * { position: relative; z-index: 1; }

    .brand {
      display: flex; align-items: center; gap: 12px;
      color: #fff;
    }
    .brand-mark {
      width: 36px; height: 36px; border-radius: 9px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: grid; place-items: center;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }
    .brand-mark svg { width: 20px; height: 20px; }
    .brand-text { font-weight: 600; font-size: 18px; letter-spacing: -0.01em; }

    .hero h1 {
      color: #fff;
      font-size: 40px;
      line-height: 1.1;
      margin: auto 0 0 0;
      letter-spacing: -0.02em;
      max-width: 480px;
    }
    .hero h1 .highlight {
      background: linear-gradient(135deg, #a5b4fc, #c4b5fd);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p.tagline {
      margin-top: 20px;
      color: #cbd5e1;
      font-size: 15px;
      line-height: 1.6;
      max-width: 460px;
    }
    .features {
      margin-top: 40px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .feature { display: flex; align-items: flex-start; gap: 12px; }
    .feature .dot {
      width: 22px; height: 22px; border-radius: 8px;
      background: rgba(165, 180, 252, 0.15);
      color: #a5b4fc;
      display: grid; place-items: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .feature .dot mat-icon { font-size: 14px; height: 14px; width: 14px; }
    .feature .txt { color: #e2e8f0; font-size: 13.5px; line-height: 1.5; }
    .feature .txt strong { color: #fff; font-weight: 600; }

    .hero .foot {
      margin-top: auto;
      padding-top: 32px;
      color: #94a3b8;
      font-size: 12px;
    }

    .form-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
      background: var(--color-bg);
    }
    .form-card {
      width: 100%;
      max-width: 400px;
    }
    .form-card h2 {
      font-size: 26px;
      margin-bottom: 6px;
      letter-spacing: -0.02em;
    }
    .form-card .sub {
      color: var(--color-text-muted);
      font-size: 14px;
      margin-bottom: 28px;
    }
    form { display: flex; flex-direction: column; gap: 4px; }
    form .actions { margin-top: 12px; }
    .primary-btn {
      width: 100%;
      background: var(--color-primary);
      color: #fff;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 120ms var(--ease-out);
      box-shadow: 0 1px 2px rgba(79, 70, 229, 0.25);
    }
    .primary-btn:hover:not(:disabled) { background: var(--color-primary-hover); }
    .primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .error {
      background: var(--color-danger-soft);
      color: var(--color-danger-text);
      border: 1px solid var(--color-danger-border);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-top: 10px;
    }
    .divider {
      margin: 24px 0;
      display: flex; align-items: center; gap: 12px;
      color: var(--color-text-muted);
      font-size: 12px;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--color-border);
    }
    .foot-link {
      text-align: center;
      font-size: 13px;
      color: var(--color-text-secondary);
    }
    .forgot-link {
      text-align: right;
      font-size: 12.5px;
      margin: -4px 0 8px;
    }
    .demo-hint {
      margin-top: 20px;
      padding: 12px 14px;
      background: var(--color-primary-soft);
      border: 1px solid #c7d2fe;
      border-radius: 10px;
      font-size: 12.5px;
      color: var(--color-primary-text);
    }
    .demo-hint strong { color: var(--color-primary-active); font-weight: 600; }
    .demo-hint code {
      background: rgba(99, 102, 241, 0.14);
      padding: 1px 5px; border-radius: 4px;
      color: var(--color-primary-active); font-size: 12px;
    }
  `],
  template: `
    <div class="auth">
      <div class="hero">
        <div class="brand">
          <div class="brand-mark">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M9 20 L16 8 L23 20 L19 20 L16 14 L13 20 Z" fill="white"/>
            </svg>
          </div>
          <div class="brand-text">{{ c.common.appName }}</div>
        </div>

        <h1>{{ c.auth.loginHeroTitle }} <span class="highlight">{{ c.auth.loginHeroHighlight }}</span>{{ c.auth.loginHeroTitleTail }}</h1>
        <p class="tagline">{{ c.auth.loginHeroSubtitle }}</p>

        <div class="features">
          <div class="feature">
            <span class="dot"><mat-icon>bolt</mat-icon></span>
            <span class="txt"><strong>Deterministic collectors</strong> for GitHub, AWS &amp; Jira — never AI guessing at facts the API can tell us.</span>
          </div>
          <div class="feature">
            <span class="dot"><mat-icon>psychology</mat-icon></span>
            <span class="txt"><strong>AI mapping with citations</strong> — every suggestion is reviewable, and humans always own the final decision.</span>
          </div>
          <div class="feature">
            <span class="dot"><mat-icon>verified_user</mat-icon></span>
            <span class="txt"><strong>Multi-tenant, encrypted secrets</strong> — envelope-encrypted credential store, full audit log, tenant isolation tested.</span>
          </div>
        </div>

        <div class="foot">© {{ c.common.appName }} · SOC 2 (DEMO)</div>
      </div>

      <div class="form-wrap">
        <div class="form-card">
          <h2>{{ c.auth.loginFormTitle }}</h2>
          <p class="sub">{{ c.auth.loginFormSubtitle }}</p>

          <form (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>{{ c.auth.emailLabel }}</mat-label>
              <input matInput type="email" name="email" [(ngModel)]="email" required autocomplete="username" [placeholder]="c.auth.emailPlaceholder">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ c.auth.passwordLabel }}</mat-label>
              <input matInput type="password" name="password" [(ngModel)]="password" required autocomplete="current-password">
            </mat-form-field>
            <div class="forgot-link"><a routerLink="/forgot-password">{{ c.auth.forgotPasswordLink }}</a></div>

            <div class="actions">
              <button class="primary-btn" type="submit" [disabled]="loading()">
                {{ loading() ? c.auth.signingInButton : c.auth.signInButton }}
              </button>
            </div>
            <div *ngIf="error()" class="error">{{ error() }}</div>
          </form>

          <div class="divider">or</div>
          <div class="foot-link">
            {{ c.auth.switchToRegister }} <a routerLink="/register">{{ c.auth.switchToRegisterAction }} →</a>
          </div>

          <div class="demo-hint">
            <strong>Demo login:</strong>
            <code>demo-owner&#64;syncpoint.local</code> / <code>demo-password-2026</code>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  private readonly store = inject(TokenStore);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  submit(): void {
    this.error.set(null);
    this.loading.set(true);
    this.api.login({ email: this.email, password: this.password }).subscribe({
      next: (t) => {
        this.store.setTokens(t.accessToken, t.refreshToken);
        this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Sign in failed');
      },
      complete: () => this.loading.set(false),
    });
  }
}
