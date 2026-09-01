import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import { DashboardSummary, Evidence, Framework, Integration } from '../../core/api/api.types';
import { CAPTIONS } from '@captions';

@Component({
  standalone: true,
  selector: 'app-onboarding',
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  styles: [`
    .hero {
      background: linear-gradient(135deg, #0b1220 0%, #1e1b4b 60%, #4c1d95 100%);
      color: #fff;
      border-radius: var(--radius-xl);
      padding: 40px;
      position: relative;
      overflow: hidden;
      margin-bottom: var(--space-6);
    }
    .hero::before {
      content: '';
      position: absolute; inset: 0;
      background:
        radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.30), transparent 55%),
        radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.22), transparent 60%);
      pointer-events: none;
    }
    .hero > * { position: relative; z-index: 1; }
    .hero .eyebrow { color: #a5b4fc; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
    .hero h1 { color: #fff; font-size: 34px; margin-top: 12px; letter-spacing: -0.02em; line-height: 1.15; max-width: 560px; }
    .hero p { color: #cbd5e1; font-size: 15px; margin-top: 12px; max-width: 560px; line-height: 1.55; }
    .progress-row {
      margin-top: 24px; display: flex; align-items: center; gap: 16px;
    }
    .progress-bar {
      flex: 1;
      max-width: 320px;
      height: 8px; border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      overflow: hidden;
    }
    .progress-bar .fill {
      height: 100%; background: linear-gradient(90deg, #a5b4fc, #c4b5fd);
      transition: width 600ms var(--ease-out);
    }
    .progress-pct { color: #fff; font-weight: 600; font-size: 15px; }
    .progress-lbl { color: #cbd5e1; font-size: 12.5px; }

    /* Steps */
    .step {
      display: flex; align-items: flex-start; gap: 20px;
      padding: 24px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-3);
      transition: all 120ms var(--ease-out);
    }
    .step:hover { box-shadow: var(--shadow-sm); }
    .step.complete { background: var(--color-success-soft); border-color: var(--color-success-border); }

    .step-num {
      width: 40px; height: 40px; border-radius: 50%;
      display: grid; place-items: center;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      font-weight: 600; font-size: 15px;
      flex-shrink: 0;
      transition: all 120ms var(--ease-out);
    }
    .step-num mat-icon { font-size: 20px; height: 20px; width: 20px; }
    .step.complete .step-num {
      background: var(--color-success); color: #fff;
    }

    .step-body { flex: 1; }
    .step-body h3 { margin: 4px 0 6px 0; font-size: 16px; }
    .step-body .desc { color: var(--color-text-secondary); font-size: 13.5px; line-height: 1.55; margin-bottom: 8px; }
    .step-body code {
      background: var(--color-surface-muted);
      padding: 1px 6px; border-radius: 4px;
      font-size: 12px;
    }

    .step-cta { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
  `],
  template: `
    <div class="page">
      <div class="hero">
        <div class="eyebrow">{{ c.onboarding.eyebrow }}</div>
        <h1>{{ c.onboarding.heroTitle }}</h1>
        <p>{{ c.onboarding.heroSubtitle }}</p>

        <div class="progress-row">
          <div class="progress-bar"><div class="fill" [style.width.%]="progressPct()"></div></div>
          <div>
            <div class="progress-pct">{{ progressPct() }}%</div>
            <div class="progress-lbl">{{ completedCount() }} of 5 steps complete</div>
          </div>
        </div>
      </div>

      <!-- Step 1 -->
      <div class="step" [class.complete]="framework() !== null">
        <div class="step-num">
          <mat-icon *ngIf="framework() !== null">check</mat-icon>
          <span *ngIf="framework() === null">1</span>
        </div>
        <div class="step-body">
          <h3>{{ c.onboarding.step1Title }}</h3>
          <p class="desc">
            <span *ngIf="framework() as f">✓ <b>{{ f.name }}</b> ({{ f.version }}) is active for your workspace. 15 controls are pre-loaded.</span>
            <span *ngIf="!framework()">{{ c.onboarding.step1Body }}</span>
          </p>
        </div>
      </div>

      <!-- Step 2 -->
      <div class="step" [class.complete]="hasIntegration()">
        <div class="step-num">
          <mat-icon *ngIf="hasIntegration()">check</mat-icon>
          <span *ngIf="!hasIntegration()">2</span>
        </div>
        <div class="step-body">
          <h3>{{ c.onboarding.step2Title }}</h3>
          <p class="desc">
            <span *ngIf="hasIntegration()">✓ You have {{ integrations().length }} integration{{ integrations().length === 1 ? '' : 's' }} connected.</span>
            <span *ngIf="!hasIntegration()">{{ c.onboarding.step2Body }}</span>
          </p>
          <div class="step-cta" *ngIf="!hasIntegration()">
            <a routerLink="/integrations" class="btn primary"><mat-icon>link</mat-icon>Connect GitHub</a>
          </div>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="step" [class.complete]="hasEvidence()">
        <div class="step-num">
          <mat-icon *ngIf="hasEvidence()">check</mat-icon>
          <span *ngIf="!hasEvidence()">3</span>
        </div>
        <div class="step-body">
          <h3>{{ c.onboarding.step3Title }}</h3>
          <p class="desc">
            <span *ngIf="hasEvidence()">✓ You have {{ evidenceCount() }} evidence artifact{{ evidenceCount() === 1 ? '' : 's' }} uploaded.</span>
            <span *ngIf="!hasEvidence()">{{ c.onboarding.step3Body }}</span>
          </p>
          <div class="step-cta" *ngIf="!hasEvidence()">
            <a routerLink="/evidence" class="btn ghost"><mat-icon>upload_file</mat-icon>Upload evidence</a>
          </div>
        </div>
      </div>

      <!-- Step 4 -->
      <div class="step" [class.complete]="hasMappings()">
        <div class="step-num">
          <mat-icon *ngIf="hasMappings()">check</mat-icon>
          <span *ngIf="!hasMappings()">4</span>
        </div>
        <div class="step-body">
          <h3>{{ c.onboarding.step4Title }}</h3>
          <p class="desc">
            <span *ngIf="hasMappings()">✓ You have {{ mappedCount() }} control{{ mappedCount() === 1 ? '' : 's' }} with mappings.</span>
            <span *ngIf="!hasMappings()">{{ c.onboarding.step4Body }}</span>
          </p>
        </div>
      </div>

      <!-- Step 5 -->
      <div class="step" [class.complete]="hasCoverage()">
        <div class="step-num">
          <mat-icon *ngIf="hasCoverage()">check</mat-icon>
          <span *ngIf="!hasCoverage()">5</span>
        </div>
        <div class="step-body">
          <h3>{{ c.onboarding.step5Title }}</h3>
          <p class="desc">
            <span *ngIf="hasCoverage()">✓ You're at {{ summary()?.coveragePercent }}% coverage. Nice progress.</span>
            <span *ngIf="!hasCoverage()">{{ c.onboarding.step5Body }}</span>
          </p>
          <div class="step-cta">
            <a routerLink="/dashboard" class="btn ghost"><mat-icon>insights</mat-icon>Open dashboard</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OnboardingComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  framework = signal<Framework | null>(null);
  integrations = signal<Integration[]>([]);
  evidence = signal<Evidence[]>([]);
  summary = signal<DashboardSummary | null>(null);

  hasIntegration = computed(() => this.integrations().length > 0);
  hasEvidence    = computed(() => this.evidence().length > 0);
  evidenceCount  = computed(() => this.evidence().length);
  hasMappings    = computed(() => {
    const s = this.summary();
    return !!s && (s.byStatus.COVERED + s.byStatus.PARTIAL + s.byStatus.NEEDS_REVIEW) > 0;
  });
  mappedCount    = computed(() => {
    const s = this.summary();
    return s ? (s.byStatus.COVERED + s.byStatus.PARTIAL + s.byStatus.NEEDS_REVIEW) : 0;
  });
  hasCoverage    = computed(() => (this.summary()?.coveragePercent ?? 0) > 0);

  completedCount = computed(() => {
    let n = 0;
    if (this.framework())     n++;
    if (this.hasIntegration()) n++;
    if (this.hasEvidence())   n++;
    if (this.hasMappings())   n++;
    if (this.hasCoverage())   n++;
    return n;
  });
  progressPct = computed(() => Math.round(this.completedCount() * 20));

  ngOnInit(): void {
    forkJoin({
      fw: this.api.frameworks(),
      i: this.api.integrations(),
      e: this.api.evidence(),
      s: this.api.summary(),
    }).subscribe(({ fw, i, e, s }) => {
      this.framework.set(fw[0] ?? null);
      this.integrations.set(i);
      this.evidence.set(e);
      this.summary.set(s);
    });
  }
}
