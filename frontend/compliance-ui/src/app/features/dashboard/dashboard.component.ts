import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '../../core/api/api.service';
import { ControlGap, DashboardSummary, Evidence, Me } from '../../core/api/api.types';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, MatIconModule],
  styles: [`
    /* Hero card with coverage ring */
    .hero {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: var(--space-8);
      padding: var(--space-8);
      background: linear-gradient(135deg, #0b1220 0%, #1e1b4b 60%, #4c1d95 100%);
      color: #fff;
      border-radius: var(--radius-xl);
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
    @media (max-width: 900px) { .hero { grid-template-columns: 1fr; padding: var(--space-5); } }

    .ring-wrap { display: grid; place-items: center; }
    .ring { position: relative; width: 220px; height: 220px; }
    .ring svg { transform: rotate(-90deg); }
    .ring .center {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #fff;
    }
    .ring .center .pct { font-size: 44px; font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
    .ring .center .label { color: #cbd5e1; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; }

    .hero-copy .eyebrow { color: #a5b4fc; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
    .hero-copy h1 { color: #fff; font-size: 30px; margin-top: 8px; line-height: 1.15; letter-spacing: -0.02em; }
    .hero-copy p { color: #cbd5e1; font-size: 14px; margin-top: 12px; max-width: 640px; line-height: 1.55; }

    .status-legend { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 20px; }
    .status-legend .item { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #cbd5e1; }
    .status-legend .swatch { width: 10px; height: 10px; border-radius: 3px; }
    .status-legend .num { color: #fff; font-weight: 600; font-size: 14px; margin-left: 4px; }

    /* KPI cards */
    .kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    @media (max-width: 1000px) { .kpi { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .kpi { grid-template-columns: 1fr; } }

    .kpi-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      display: flex; flex-direction: column; gap: 6px;
      transition: box-shadow var(--transition-normal);
    }
    .kpi-card:hover { box-shadow: var(--shadow-md); }
    .kpi-card .head {
      display: flex; align-items: center; justify-content: space-between;
      color: var(--color-text-muted);
      font-size: 12px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .kpi-card .icon-wrap {
      width: 32px; height: 32px; border-radius: 8px;
      display: grid; place-items: center;
      background: var(--color-primary-soft); color: var(--color-primary);
    }
    .kpi-card.covered  .icon-wrap { background: var(--color-success-soft); color: var(--color-success-text); }
    .kpi-card.partial  .icon-wrap { background: var(--color-warning-soft); color: var(--color-warning-text); }
    .kpi-card.missing  .icon-wrap { background: var(--color-danger-soft);  color: var(--color-danger-text); }
    .kpi-card.review   .icon-wrap { background: var(--color-info-soft);    color: var(--color-info-text); }
    .kpi-card .icon-wrap mat-icon { font-size: 16px; height: 16px; width: 16px; }
    .kpi-card .value { font-size: 30px; font-weight: 600; letter-spacing: -0.02em; color: var(--color-text); }
    .kpi-card .desc  { font-size: 12.5px; color: var(--color-text-muted); }

    /* Two-column layout */
    .two-col { display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--space-4); }
    @media (max-width: 1000px) { .two-col { grid-template-columns: 1fr; } }

    .link-arrow {
      display: inline-flex; align-items: center; gap: 4px;
      color: var(--color-primary-text);
      font-size: 13px; font-weight: 500;
    }

    .code-cell {
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--color-primary-text);
      font-weight: 500;
    }

    .source-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 2px 8px; background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: 999px;
      font-size: 12px; color: var(--color-text-secondary);
    }
    .source-pill mat-icon { font-size: 12px; height: 12px; width: 12px; }

    .greeting {
      font-size: 22px; font-weight: 600; letter-spacing: -0.02em;
      margin-bottom: 4px;
    }
    .sub-line { color: var(--color-text-muted); font-size: 13.5px; margin-bottom: 24px; }
  `],
  template: `
    <div class="page">
      <div class="greeting">{{ salutation() }}, {{ (me()?.name ?? '').split(' ')[0] || 'there' }} 👋</div>
      <div class="sub-line">Here's what your workspace looks like right now.</div>

      <!-- Hero: coverage ring + copy -->
      <div class="hero" *ngIf="summary() as s">
        <div class="ring-wrap">
          <div class="ring">
            <svg width="220" height="220" viewBox="0 0 220 220">
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"  stop-color="#a5b4fc"/>
                  <stop offset="100%" stop-color="#8b5cf6"/>
                </linearGradient>
              </defs>
              <circle cx="110" cy="110" r="94" stroke="rgba(255,255,255,0.10)" stroke-width="14" fill="none"/>
              <circle cx="110" cy="110" r="94"
                      stroke="url(#ringGrad)" stroke-width="14" fill="none"
                      stroke-linecap="round"
                      [attr.stroke-dasharray]="ringDash(s.coveragePercent)"
                      style="transition: stroke-dasharray 800ms cubic-bezier(0.16, 1, 0.3, 1);"/>
            </svg>
            <div class="center">
              <div class="pct">{{ s.coveragePercent }}%</div>
              <div class="label">Evidence coverage</div>
            </div>
          </div>
        </div>

        <div class="hero-copy">
          <div class="eyebrow">SOC 2 · Demo Framework</div>
          <h1>{{ heroHeading(s) }}</h1>
          <p>
            {{ s.totalEvidence }} evidence artifact{{ s.totalEvidence === 1 ? '' : 's' }} collected,
            {{ s.connectedIntegrations }} of {{ s.totalIntegrations }} integration{{ s.totalIntegrations === 1 ? '' : 's' }} connected.
            Track every mapping decision back to who made it — human or AI, with a citation trail.
          </p>

          <div class="status-legend">
            <div class="item"><span class="swatch" style="background:#10b981;"></span>Covered <span class="num">{{ s.byStatus.COVERED }}</span></div>
            <div class="item"><span class="swatch" style="background:#f59e0b;"></span>Partial <span class="num">{{ s.byStatus.PARTIAL }}</span></div>
            <div class="item"><span class="swatch" style="background:#8b5cf6;"></span>Needs review <span class="num">{{ s.byStatus.NEEDS_REVIEW }}</span></div>
            <div class="item"><span class="swatch" style="background:#ef4444;"></span>Missing <span class="num">{{ s.byStatus.MISSING }}</span></div>
          </div>
        </div>
      </div>

      <!-- KPI row -->
      <div class="kpi" *ngIf="summary() as s">
        <div class="kpi-card covered">
          <div class="head"><span>Controls covered</span><span class="icon-wrap"><mat-icon>check_circle</mat-icon></span></div>
          <div class="value">{{ s.byStatus.COVERED }} <span style="color:var(--color-text-muted);font-size:14px;font-weight:400;">/ {{ s.totalControls }}</span></div>
          <div class="desc">Human-confirmed mappings marked COVERED.</div>
        </div>
        <div class="kpi-card review">
          <div class="head"><span>Needs your review</span><span class="icon-wrap"><mat-icon>reviews</mat-icon></span></div>
          <div class="value">{{ s.byStatus.NEEDS_REVIEW }}</div>
          <div class="desc">AI suggested a mapping, awaiting confirmation.</div>
        </div>
        <div class="kpi-card partial">
          <div class="head"><span>Partial coverage</span><span class="icon-wrap"><mat-icon>hourglass_top</mat-icon></span></div>
          <div class="value">{{ s.byStatus.PARTIAL }}</div>
          <div class="desc">Some evidence present; more supporting artifacts needed.</div>
        </div>
        <div class="kpi-card missing">
          <div class="head"><span>Total evidence</span><span class="icon-wrap"><mat-icon>description</mat-icon></span></div>
          <div class="value">{{ s.totalEvidence }}</div>
          <div class="desc">Artifacts uploaded or auto-collected.</div>
        </div>
      </div>

      <!-- Two-column: gaps + recent -->
      <div class="two-col">
        <div class="card">
          <div class="card-header">
            <h2>Evidence gaps</h2>
            <a routerLink="/controls" class="link-arrow">Review controls <mat-icon style="font-size:14px;height:14px;width:14px;">arrow_forward</mat-icon></a>
          </div>
          <table class="data-table" *ngIf="gaps().length; else emptyG">
            <thead><tr><th>Control</th><th>Title</th><th>Category</th><th style="text-align:right;">Status</th></tr></thead>
            <tbody>
              <tr *ngFor="let g of gaps() | slice:0:6">
                <td><a [routerLink]="['/controls', g.controlId]" class="code-cell">{{ g.code }}</a></td>
                <td>{{ g.title }}</td>
                <td class="muted">{{ g.category }}</td>
                <td style="text-align:right;"><span class="badge" [class]="statusClass(g.status)">{{ statusLabel(g.status) }}</span></td>
              </tr>
            </tbody>
          </table>
          <ng-template #emptyG>
            <div class="empty">
              <div class="icon-wrap"><mat-icon>celebration</mat-icon></div>
              <h3>All controls covered</h3>
              <p>You're in great shape.</p>
            </div>
          </ng-template>
        </div>

        <div class="card">
          <div class="card-header">
            <h2>Recent evidence</h2>
            <a routerLink="/evidence" class="link-arrow">See all <mat-icon style="font-size:14px;height:14px;width:14px;">arrow_forward</mat-icon></a>
          </div>
          <table class="data-table" *ngIf="recent().length; else emptyEv">
            <thead><tr><th>Name</th><th>Source</th><th style="text-align:right;">Freshness</th></tr></thead>
            <tbody>
              <tr *ngFor="let e of recent() | slice:0:6">
                <td>
                  <div style="font-weight:500;">{{ e.name }}</div>
                  <div class="muted small" style="margin-top:2px;">{{ e.collectedAt | date:'MMM d, h:mm a' }}</div>
                </td>
                <td><span class="source-pill"><mat-icon>{{ sourceIcon(e.sourceType) }}</mat-icon>{{ sourceLabel(e.sourceType) }}</span></td>
                <td style="text-align:right;"><span class="badge" [class]="freshnessClass(e.freshness)">{{ e.freshness }}</span></td>
              </tr>
            </tbody>
          </table>
          <ng-template #emptyEv>
            <div class="empty">
              <div class="icon-wrap"><mat-icon>upload_file</mat-icon></div>
              <h3>No evidence yet</h3>
              <p>Upload from the Evidence page or connect an integration.</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  summary = signal<DashboardSummary | null>(null);
  gaps = signal<ControlGap[]>([]);
  recent = signal<Evidence[]>([]);
  me = signal<Me | null>(null);

  salutation = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  });

  ngOnInit(): void {
    this.api.me().subscribe(m => this.me.set(m));
    this.api.summary().subscribe(s => this.summary.set(s));
    this.api.gaps().subscribe(g => this.gaps.set(g));
    this.api.recentEvidence().subscribe(e => this.recent.set(e));
  }

  // Ring math: circumference of r=94 is 2*PI*94 ≈ 590.62.
  ringDash(pct: number): string {
    const circ = 2 * Math.PI * 94;
    const fill = Math.max(0, Math.min(100, pct)) / 100 * circ;
    return `${fill} ${circ}`;
  }

  heroHeading(s: DashboardSummary): string {
    if (s.coveragePercent === 0) return 'Ready when you are — let\'s bring in your first evidence.';
    if (s.coveragePercent < 25) return 'Early progress. Keep confirming AI-suggested mappings.';
    if (s.coveragePercent < 60) return 'You\'re making steady progress on coverage.';
    if (s.coveragePercent < 90) return 'Great momentum — you\'re nearly there.';
    return 'Excellent coverage. Ready to export an audit package.';
  }

  statusClass(s: string): string {
    return { COVERED: 'covered', PARTIAL: 'partial', MISSING: 'missing', NEEDS_REVIEW: 'needs-review' }[s] ?? '';
  }
  statusLabel(s: string): string {
    return { COVERED: 'Covered', PARTIAL: 'Partial', MISSING: 'Missing', NEEDS_REVIEW: 'Needs review' }[s] ?? s;
  }
  freshnessClass(s: string): string {
    return { CURRENT: 'covered', EXPIRING: 'partial', EXPIRED: 'missing' }[s] ?? '';
  }
  sourceIcon(s: string): string {
    return { MANUAL_UPLOAD: 'upload_file', GITHUB: 'code', AWS: 'cloud', JIRA: 'bug_report', GOOGLE_WORKSPACE: 'groups' }[s] ?? 'description';
  }
  sourceLabel(s: string): string {
    return { MANUAL_UPLOAD: 'Manual upload', GITHUB: 'GitHub', AWS: 'AWS', JIRA: 'Jira', GOOGLE_WORKSPACE: 'Google Workspace' }[s] ?? s;
  }
}
