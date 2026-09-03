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
  selector: 'app-register',
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
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-mark {
      width: 36px; height: 36px; border-radius: 9px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: grid; place-items: center;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }
    .brand-mark svg { width: 20px; height: 20px; }
    .brand-text { font-weight: 600; font-size: 18px; letter-spacing: -0.01em; color: #fff; }

    .hero h1 { color: #fff; font-size: 40px; line-height: 1.1; margin: auto 0 0 0; letter-spacing: -0.02em; max-width: 480px; }
    .hero h1 .highlight { background: linear-gradient(135deg, #a5b4fc, #c4b5fd); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    .hero p.tagline { margin-top: 20px; color: #cbd5e1; font-size: 15px; line-height: 1.6; max-width: 460px; }

    .steps { margin-top: 40px; display: flex; flex-direction: column; gap: 18px; }
    .step { display: flex; align-items: flex-start; gap: 14px; }
    .step .num {
      width: 26px; height: 26px; border-radius: 50%;
      background: rgba(165, 180, 252, 0.15);
      color: #a5b4fc;
      display: grid; place-items: center;
      font-weight: 600; font-size: 12px;
      flex-shrink: 0;
    }
    .step .txt { color: #e2e8f0; font-size: 13.5px; line-height: 1.5; }
    .step .txt strong { color: #fff; font-weight: 600; }

    .hero .foot { margin-top: auto; padding-top: 32px; color: #94a3b8; font-size: 12px; }

    .form-wrap { display: flex; align-items: center; justify-content: center; padding: 48px; background: var(--color-bg); }
    .form-card { width: 100%; max-width: 440px; }
    .form-card h2 { font-size: 26px; margin-bottom: 6px; letter-spacing: -0.02em; }
    .form-card .sub { color: var(--color-text-muted); font-size: 14px; margin-bottom: 28px; }
    form { display: flex; flex-direction: column; gap: 4px; }
    form .actions { margin-top: 12px; }
    .primary-btn {
      width: 100%; background: var(--color-primary); color: #fff; border: none;
      padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 500;
      font-family: inherit; cursor: pointer; transition: all 120ms var(--ease-out);
      box-shadow: 0 1px 2px rgba(79, 70, 229, 0.25);
    }
    .primary-btn:hover:not(:disabled) { background: var(--color-primary-hover); }
    .primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .error {
      background: var(--color-danger-soft); color: var(--color-danger-text);
      border: 1px solid var(--color-danger-border);
      padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-top: 10px;
    }
    .divider {
      margin: 24px 0; display: flex; align-items: center; gap: 12px;
      color: var(--color-text-muted); font-size: 12px;
    }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--color-border); }
    .foot-link { text-align: center; font-size: 13px; color: var(--color-text-secondary); }
    .fine-print { font-size: 11.5px; color: var(--color-text-muted); margin-top: 18px; line-height: 1.5; }
  `],
  template: `
    <div class="auth">
      <div class="hero">
        <div class="brand">
          <div class="brand-mark"><svg viewBox="0 0 32 32" fill="none"><path d="M9 20 L16 8 L23 20 L19 20 L16 14 L13 20 Z" fill="white"/></svg></div>
          <div class="brand-text">{{ c.common.appName }}</div>
        </div>

        <h1>{{ c.auth.registerHeroTitle }} <span class="highlight">{{ c.auth.registerHeroHighlight }}</span>{{ c.auth.registerHeroTitleTail }}</h1>
        <p class="tagline">{{ c.auth.registerHeroSubtitle }}</p>

        <div class="steps">
          <div class="step"><span class="num">1</span><span class="txt"><strong>Create your organization.</strong> You'll be the OWNER. Invite team-mates later from Settings.</span></div>
          <div class="step"><span class="num">2</span><span class="txt"><strong>Pick SOC 2.</strong> Fifteen demo controls are pre-loaded so you can see coverage right away.</span></div>
          <div class="step"><span class="num">3</span><span class="txt"><strong>Connect GitHub</strong> with a fine-grained PAT. Everything stays encrypted and never leaves your server.</span></div>
          <div class="step"><span class="num">4</span><span class="txt"><strong>Watch coverage grow</strong> as the AI suggests mappings and you confirm what fits.</span></div>
        </div>

        <div class="foot">© {{ c.common.appName }} · SOC 2 (DEMO)</div>
      </div>

      <div class="form-wrap">
        <div class="form-card">
          <h2>{{ c.auth.registerFormTitle }}</h2>
          <p class="sub">{{ c.auth.registerFormSubtitle }}</p>

          <form (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>{{ c.auth.nameLabel }}</mat-label>
              <input matInput name="name" [(ngModel)]="name" required autocomplete="name" [placeholder]="c.auth.namePlaceholder">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ c.auth.emailLabel }}</mat-label>
              <input matInput type="email" name="email" [(ngModel)]="email" required autocomplete="email" [placeholder]="c.auth.emailPlaceholder">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Password (min 12 characters)</mat-label>
              <input matInput type="password" name="password" [(ngModel)]="password" minlength="12" required autocomplete="new-password">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ c.auth.organizationLabel }}</mat-label>
              <input matInput name="org" [(ngModel)]="organizationName" required [placeholder]="c.auth.organizationPlaceholder">
            </mat-form-field>

            <div class="actions">
              <button class="primary-btn" type="submit" [disabled]="loading()">
                {{ loading() ? c.auth.creatingButton : c.auth.createButton }}
              </button>
            </div>
            <div *ngIf="error()" class="error">{{ error() }}</div>
          </form>

          <div class="divider">or</div>
          <div class="foot-link">
            {{ c.auth.switchToLogin }} <a routerLink="/login">{{ c.auth.switchToLoginAction }} →</a>
          </div>

          <p class="fine-print">
            By creating an organization you agree that Syncpoint reports evidence-coverage states only —
            it does not determine SOC 2 compliance. Compliance determinations are made by licensed CPA firms.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  private readonly store = inject(TokenStore);
  private readonly router = inject(Router);

  name = '';
  email = '';
  password = '';
  organizationName = '';
  loading = signal(false);
  error = signal<string | null>(null);

  submit(): void {
    this.error.set(null);
    this.loading.set(true);
    this.api.register({
      email: this.email, password: this.password,
      name: this.name, organizationName: this.organizationName,
    }).subscribe({
      next: (t) => {
        this.store.setTokens(t.accessToken, t.refreshToken);
        this.router.navigateByUrl('/onboarding', { replaceUrl: true });
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Registration failed');
      },
      complete: () => this.loading.set(false),
    });
  }
}
