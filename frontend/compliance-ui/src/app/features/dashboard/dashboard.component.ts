import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '../../core/api/api.service';
import { ControlGap, ControlStatus, CoverageTrendPoint, DashboardSummary, Evidence, Me } from '../../core/api/api.types';
import { CAPTIONS } from '@captions';
import {
  controlStatusClass as _controlStatusClass,
  controlStatusMeta,
  evidenceSourceIcon as _sourceIcon,
  evidenceSourceLabel as _sourceLabel,
  freshnessClass as _freshnessClass,
  statusColorVar,
} from '@constants';

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
    .two-col { display: grid; grid-template-columns: 1fr; gap: var(--space-4); }

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

    /* Coverage trend */
    .trend-card { margin-bottom: var(--space-4); }
    .trend-plot { position: relative; animation: trendFadeIn 600ms cubic-bezier(0.16, 1, 0.3, 1); }
    .trend-chart {
      width: 100%;
      aspect-ratio: 640 / 200;
      max-height: 260px;
      min-height: 150px;
      display: block;
    }
    .trend-gridline { stroke: var(--color-divider); stroke-width: 1; stroke-dasharray: 3 5; opacity: 0.6; }
    .trend-gridlabel { font-size: 9px; fill: var(--color-text-muted); }
    .trend-coverage-line { stroke-width: 2.5px; stroke-linecap: round; }
    .trend-line-secondary { stroke-width: 1.5px; stroke-linecap: round; opacity: 0.5; }
    .trend-end-dot {
      fill: #fff; stroke: var(--color-success); stroke-width: 2;
      transform-box: fill-box; transform-origin: center;
      animation: trendPulse 2.2s ease-in-out infinite;
    }
    .trend-crosshair { stroke: var(--color-text-muted); stroke-width: 1; stroke-dasharray: 3 3; opacity: 0.55; pointer-events: none; }
    @keyframes trendFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes trendPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.7); opacity: 0.65; } }

    .trend-tooltip {
      position: absolute; top: 6px; transform: translateX(-50%);
      background: var(--color-text); color: #fff;
      border-radius: var(--radius-md);
      padding: 10px 12px;
      font-size: 12px; line-height: 1.5;
      box-shadow: var(--shadow-lg);
      pointer-events: none;
      white-space: nowrap;
      z-index: 5;
    }
    .trend-tooltip-date { font-weight: 600; margin-bottom: 2px; }
    .trend-tooltip-pct { color: #c7d2fe; font-size: 11px; margin-bottom: 6px; }
    .trend-tooltip-row { display: flex; align-items: center; gap: 6px; }
    .trend-tooltip-row i { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
    .trend-tooltip-row strong { margin-left: auto; padding-left: 12px; font-weight: 600; }

    .trend-x-axis {
      display: flex; justify-content: space-between;
      padding: 4px var(--space-6) 0 calc(var(--space-6) + 6.875%);
      font-size: 11px; color: var(--color-text-muted);
    }
    .trend-summary { padding: 2px var(--space-6) 20px; font-size: 12.5px; color: var(--color-text-secondary); font-weight: 500; }
    .trend-legend {
      display: flex; flex-wrap: wrap; gap: 16px;
      padding: 14px var(--space-6) var(--space-5);
      border-top: 1px solid var(--color-divider);
      margin-top: 12px;
    }
    .trend-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--color-text-secondary); }
    .trend-legend-item .dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    .trend-legend-item strong { color: var(--color-text); font-weight: 600; }
    .trend-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 6px; padding: 32px 16px; text-align: center;
      color: var(--color-text-muted);
    }
    .trend-empty mat-icon { font-size: 22px; height: 22px; width: 22px; color: var(--color-text-muted); }
    .trend-empty h3 { font-size: 14px; color: var(--color-text); margin: 0; }
    .trend-empty p { font-size: 12.5px; margin: 0; max-width: 380px; }
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
              <div class="label">{{ c.dashboard.coverageLabel }}</div>
            </div>
          </div>
        </div>

        <div class="hero-copy">
          <div class="eyebrow">{{ c.dashboard.eyebrow }}</div>
          <h1>{{ heroHeading(s) }}</h1>
          <p>{{ c.dashboard.heroSubtitle }}</p>

          <div class="status-legend">
            <div class="item"><span class="swatch" style="background:#10b981;"></span>{{ c.status.COVERED }} <span class="num">{{ s.byStatus.COVERED }}</span></div>
            <div class="item"><span class="swatch" style="background:#f59e0b;"></span>{{ c.status.PARTIAL }} <span class="num">{{ s.byStatus.PARTIAL }}</span></div>
            <div class="item"><span class="swatch" style="background:#8b5cf6;"></span>{{ c.status.NEEDS_REVIEW }} <span class="num">{{ s.byStatus.NEEDS_REVIEW }}</span></div>
            <div class="item"><span class="swatch" style="background:#ef4444;"></span>{{ c.status.MISSING }} <span class="num">{{ s.byStatus.MISSING }}</span></div>
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

      <!-- Coverage trend -->
      <div class="card trend-card">
        <div class="card-header">
          <h2>{{ c.dashboard.trendTitle }}</h2>
        </div>
        <p class="muted small" style="padding:0 var(--space-6) 12px;">{{ c.dashboard.trendCaption }}</p>

        <ng-container *ngIf="trend().length >= 2; else trendEmpty">
          <p class="trend-summary">{{ trendSummaryText() }}</p>

          <div class="trend-plot">
            <svg #trendSvg class="trend-chart" viewBox="0 0 640 200" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="trendLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stop-color="#6ee7b7"/>
                  <stop offset="100%" stop-color="#059669"/>
                </linearGradient>
                <filter id="trendGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.5" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <line *ngFor="let pct of trendGridPercents" class="trend-gridline"
                    x1="44" [attr.y1]="trendYFor(pct)" x2="640" [attr.y2]="trendYFor(pct)"/>
              <text *ngFor="let pct of trendGridPercents" class="trend-gridlabel"
                    x="38" text-anchor="end" dominant-baseline="middle" [attr.y]="trendYFor(pct)">{{ pct }}%</text>

              <path *ngFor="let line of trendLines()"
                    [attr.d]="line.path" fill="none"
                    [class.trend-coverage-line]="line.status === 'COVERED'"
                    [class.trend-line-secondary]="line.status !== 'COVERED'"
                    [attr.stroke]="line.status === 'COVERED' ? 'url(#trendLineGrad)' : line.color"
                    [attr.filter]="line.status === 'COVERED' ? 'url(#trendGlow)' : null"/>

              <circle *ngIf="trendCoverageDot() as dot" class="trend-end-dot"
                      [attr.cx]="dot.x" [attr.cy]="dot.y" r="4"/>

              <line *ngIf="hoverIndex() !== null" class="trend-crosshair"
                    [attr.x1]="trendHoverX()" y1="4" [attr.x2]="trendHoverX()" y2="196"/>

              <rect x="44" y="0" width="596" height="200" fill="transparent"
                    (mousemove)="onTrendMove($event, trendSvg)" (mouseleave)="onTrendLeave()"/>
            </svg>

            <div class="trend-tooltip" *ngIf="trendHoverData() as d" [style.left.%]="trendHoverLeftPct()">
              <div class="trend-tooltip-date">{{ d.date }}</div>
              <div class="trend-tooltip-pct">{{ d.pct }}% covered</div>
              <div class="trend-tooltip-row"><i style="background:var(--color-success)"></i>Covered <strong>{{ d.covered }}</strong></div>
              <div class="trend-tooltip-row"><i style="background:var(--color-warning)"></i>Partial <strong>{{ d.partial }}</strong></div>
              <div class="trend-tooltip-row"><i style="background:var(--color-info)"></i>Needs review <strong>{{ d.needsReview }}</strong></div>
              <div class="trend-tooltip-row"><i style="background:var(--color-danger)"></i>Missing <strong>{{ d.missing }}</strong></div>
            </div>
          </div>

          <div class="trend-x-axis">
            <span *ngFor="let l of trendXAxisLabels()">{{ l }}</span>
          </div>
          <div class="trend-legend">
            <div class="trend-legend-item" *ngFor="let item of trendLegend()">
              <span class="dot" [style.background]="item.color"></span>
              {{ item.label }} <strong>{{ item.count }}</strong>
            </div>
          </div>
        </ng-container>

        <ng-template #trendEmpty>
          <div class="trend-empty">
            <mat-icon>show_chart</mat-icon>
            <h3>{{ c.dashboard.trendEmptyTitle }}</h3>
            <p>{{ c.dashboard.trendEmptyMessage }}</p>
          </div>
        </ng-template>
      </div>

      <!-- Two-column: gaps + recent -->
      <div class="two-col">
        <div class="card">
          <div class="card-header">
            <h2>{{ c.dashboard.gapsTitle }}</h2>
            <a routerLink="/controls" class="link-arrow">{{ c.dashboard.goToControls }} <mat-icon style="font-size:14px;height:14px;width:14px;">arrow_forward</mat-icon></a>
          </div>
          <table class="data-table" *ngIf="gaps().length; else emptyG">
            <thead><tr><th>{{ c.controls.tableCode }}</th><th>{{ c.controls.tableTitle }}</th><th>{{ c.controls.tableCategory }}</th><th style="text-align:right;">{{ c.controls.tableStatus }}</th></tr></thead>
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
              <h3>{{ c.dashboard.gapsEmptyTitle }}</h3>
              <p>{{ c.dashboard.gapsEmptyMessage }}</p>
            </div>
          </ng-template>
        </div>

        <div class="card">
          <div class="card-header">
            <h2>{{ c.dashboard.recentEvidenceTitle }}</h2>
            <a routerLink="/evidence" class="link-arrow">{{ c.dashboard.goToEvidence }} <mat-icon style="font-size:14px;height:14px;width:14px;">arrow_forward</mat-icon></a>
          </div>
          <table class="data-table" *ngIf="recent().length; else emptyEv">
            <thead><tr><th>{{ c.evidence.tableName }}</th><th>{{ c.evidence.tableSource }}</th><th style="text-align:right;">{{ c.evidence.tableFreshness }}</th></tr></thead>
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
              <h3>{{ c.dashboard.recentEvidenceEmptyTitle }}</h3>
              <p>{{ c.dashboard.recentEvidenceEmptyMessage }}</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  summary = signal<DashboardSummary | null>(null);
  gaps = signal<ControlGap[]>([]);
  recent = signal<Evidence[]>([]);
  me = signal<Me | null>(null);
  trend = signal<CoverageTrendPoint[]>([]);

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
    this.api.coverageTrend(30).subscribe(t => this.trend.set(t));
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

  statusClass(s: string): string { return _controlStatusClass(s); }
  statusLabel(s: string): string { return (CAPTIONS.status as Record<string, string>)[s] ?? s; }
  freshnessClass(s: string): string { return _freshnessClass(s); }
  sourceIcon(s: string): string { return _sourceIcon(s); }
  sourceLabel(s: string): string { return _sourceLabel(s); }

  // ─── Coverage trend: multi-line chart (no fills) ────────────────────
  // viewBox is 640x200. Each status gets its own independent %-of-total line
  // per day (not stacked) — COVERED is the "hero" line: bold gradient stroke
  // + soft glow. The other three stay thin and muted so the eye lands on
  // coverage first, but the full breakdown is still there via the tooltip.
  // Lines are Catmull-Rom smoothed curves, not straight segments.
  private readonly trendStackOrder: readonly ControlStatus[] = ['COVERED', 'PARTIAL', 'NEEDS_REVIEW', 'MISSING'];
  readonly trendGridPercents = [0, 25, 50, 75, 100];
  private readonly plotLeft = 44;
  private readonly plotWidth = 596;
  private readonly plotHeight = 200;

  hoverIndex = signal<number | null>(null);

  private trendCountFor(point: CoverageTrendPoint, status: ControlStatus): number {
    return ({
      COVERED: point.covered, PARTIAL: point.partial,
      NEEDS_REVIEW: point.needsReview, MISSING: point.missing,
    } as Record<ControlStatus, number>)[status];
  }

  private trendXFor(index: number, count: number): number {
    return count === 1 ? this.plotLeft + this.plotWidth / 2 : this.plotLeft + (index / (count - 1)) * this.plotWidth;
  }

  trendYFor(percent: number): number {
    const pad = 10;
    return pad + (1 - percent / 100) * (this.plotHeight - pad * 2);
  }

  private pathForward(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length < 3) return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
      const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }

  trendLines(): { status: ControlStatus; color: string; path: string }[] {
    const points = this.trend();
    const n = points.length;
    if (n < 2) return [];
    const xs = points.map((_, i) => this.trendXFor(i, n));
    return this.trendStackOrder.map(status => {
      const pts = points.map((p, i) => {
        const total = p.covered + p.partial + p.needsReview + p.missing || 1;
        const pct = (this.trendCountFor(p, status) / total) * 100;
        return { x: xs[i], y: this.trendYFor(pct) };
      });
      return { status, color: statusColorVar(controlStatusMeta(status)), path: this.pathForward(pts) };
    });
  }

  trendCoverageDot(): { x: number; y: number } | null {
    const points = this.trend();
    const n = points.length;
    if (!n) return null;
    const p = points[n - 1];
    const total = p.covered + p.partial + p.needsReview + p.missing || 1;
    return { x: this.trendXFor(n - 1, n), y: this.trendYFor((p.covered / total) * 100) };
  }

  onTrendMove(evt: MouseEvent, svg: Element): void {
    const n = this.trend().length;
    if (n < 2) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((evt.clientX - rect.left) / rect.width) * 640;
    let nearest = 0, nearestDist = Infinity;
    for (let i = 0; i < n; i++) {
      const dist = Math.abs(this.trendXFor(i, n) - svgX);
      if (dist < nearestDist) { nearestDist = dist; nearest = i; }
    }
    this.hoverIndex.set(nearest);
  }

  onTrendLeave(): void {
    this.hoverIndex.set(null);
  }

  trendHoverX(): number | null {
    const i = this.hoverIndex();
    return i === null ? null : this.trendXFor(i, this.trend().length);
  }

  trendHoverLeftPct(): number {
    const x = this.trendHoverX();
    return x === null ? 0 : (x / 640) * 100;
  }

  trendHoverData(): { date: string; covered: number; partial: number; needsReview: number; missing: number; pct: number } | null {
    const i = this.hoverIndex();
    if (i === null) return null;
    const p = this.trend()[i];
    return {
      date: formatDate(p.date, 'MMM d, y', 'en-US'),
      covered: p.covered, partial: p.partial, needsReview: p.needsReview, missing: p.missing,
      pct: p.coveragePercent,
    };
  }

  trendXAxisLabels(): string[] {
    const points = this.trend();
    const n = points.length;
    if (n < 2) return [];
    const indices = n === 2 ? [0, n - 1] : [0, Math.floor((n - 1) / 2), n - 1];
    return indices.map((i, k) =>
      k === indices.length - 1 ? this.c.dashboard.trendToday : formatDate(points[i].date, 'MMM d', 'en-US'));
  }

  trendLegend(): { status: ControlStatus; label: string; color: string; count: number }[] {
    const points = this.trend();
    if (!points.length) return [];
    const latest = points[points.length - 1];
    return this.trendStackOrder.map(status => ({
      status,
      label: (this.c.status as Record<string, string>)[status] ?? status,
      color: statusColorVar(controlStatusMeta(status)),
      count: this.trendCountFor(latest, status),
    }));
  }

  trendSummaryText(): string {
    const points = this.trend();
    if (points.length < 2) return '';
    const first = points[0], last = points[points.length - 1];
    return this.c.dashboard.trendSummary(first.coveragePercent, last.coveragePercent, points.length);
  }
}
