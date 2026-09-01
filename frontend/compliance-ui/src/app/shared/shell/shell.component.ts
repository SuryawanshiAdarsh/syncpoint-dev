import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

import { ApiService } from '../../core/api/api.service';
import { TokenStore } from '../../core/auth/token-store.service';
import { Me } from '../../core/api/api.types';
import { CAPTIONS } from '@captions';

interface NavItem { path: string; label: string; icon: string; }
interface NavSection { title: string; items: NavItem[]; }

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
            MatIconModule, MatMenuModule, MatButtonModule],
  styles: [`
    :host { display: block; height: 100vh; }

    .shell {
      display: grid;
      grid-template-columns: 260px 1fr;
      grid-template-rows: 100vh;
      background: var(--color-bg);
    }
    @media (max-width: 900px) {
      .shell { grid-template-columns: 72px 1fr; }
      .side .brand-text, .side .section-title, .side .link-label, .side .footer { display: none; }
      .side .link { justify-content: center; padding: 10px; }
    }

    .side {
      background: var(--sidebar-bg);
      background-image:
        radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.12), transparent 40%),
        radial-gradient(circle at 0% 100%, rgba(139, 92, 246, 0.10), transparent 40%);
      color: var(--sidebar-text);
      display: flex;
      flex-direction: column;
      padding: 20px 16px 16px;
      border-right: 1px solid var(--sidebar-border);
      overflow-y: auto;
    }

    .brand {
      display: flex; align-items: center; gap: 10px;
      padding: 4px 8px 20px 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--sidebar-border);
    }
    .brand-mark {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: grid; place-items: center;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      flex-shrink: 0;
    }
    .brand-mark svg { width: 18px; height: 18px; }
    .brand-text { display: flex; flex-direction: column; line-height: 1.1; }
    .brand-text .name { color: #fff; font-weight: 600; font-size: 15px; }
    .brand-text .plan { color: var(--sidebar-text-muted); font-size: 11px; margin-top: 2px; }

    .section-title {
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--sidebar-text-heading);
      padding: 12px 12px 6px;
      margin-top: 4px;
    }

    .link {
      position: relative;
      display: flex; align-items: center; gap: 12px;
      padding: 8px 12px;
      margin: 1px 0;
      border-radius: 8px;
      color: var(--sidebar-text);
      font-size: 13.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 120ms var(--ease-out);
      text-decoration: none;
    }
    .link mat-icon { font-size: 18px; height: 18px; width: 18px; color: var(--sidebar-text-muted); }
    .link:hover { background: var(--sidebar-hover-bg); color: #fff; }
    .link:hover mat-icon { color: var(--sidebar-text); }
    .link.active { background: var(--sidebar-active-bg); color: var(--sidebar-active-text); }
    .link.active mat-icon { color: var(--sidebar-active-marker); }
    .link.active::before {
      content: '';
      position: absolute; left: -16px; top: 6px; bottom: 6px; width: 3px;
      background: var(--sidebar-active-marker);
      border-radius: 0 3px 3px 0;
    }

    .side .footer {
      margin-top: auto;
      padding: 16px 12px 8px;
      border-top: 1px solid var(--sidebar-border);
      color: var(--sidebar-text-muted);
      font-size: 11px;
    }
    .side .footer .status-line { display: flex; align-items: center; gap: 8px; }
    .side .footer .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    .main { display: flex; flex-direction: column; overflow: hidden; }

    header {
      display: flex; align-items: center;
      padding: 12px 32px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      min-height: 60px;
      flex-shrink: 0;
    }
    header .breadcrumbs { display: flex; align-items: center; gap: 8px; color: var(--color-text-muted); font-size: 13px; }
    header .breadcrumbs .separator { color: var(--color-border-strong); }
    header .breadcrumbs .current { color: var(--color-text); font-weight: 500; }

    header .actions { display: flex; align-items: center; gap: 12px; }

    .avatar-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 4px 10px 4px 4px;
      border-radius: 999px;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      cursor: pointer;
      transition: all 120ms var(--ease-out);
    }
    .avatar-btn:hover { background: var(--color-surface-muted); }
    .avatar {
      width: 28px; height: 28px; border-radius: 999px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; font-weight: 600; font-size: 12px;
      display: grid; place-items: center;
      flex-shrink: 0;
    }
    .avatar-btn .who { font-size: 12.5px; line-height: 1.2; text-align: left; }
    .avatar-btn .who .name { color: var(--color-text); font-weight: 500; }
    .avatar-btn .who .role { color: var(--color-text-muted); font-size: 11px; margin-top: 1px; }

    .content { flex: 1; overflow-y: auto; background: var(--color-bg); }

    .user-menu-header {
      padding: 16px; display: flex; align-items: center; gap: 12px;
      border-bottom: 1px solid var(--color-divider);
    }
    .user-menu-header .avatar { width: 40px; height: 40px; font-size: 15px; }
    .user-menu-header .stack { display: flex; flex-direction: column; gap: 2px; }
    .user-menu-header .name { font-weight: 600; }
    .user-menu-header .email, .user-menu-header .org { font-size: 12px; color: var(--color-text-muted); }
  `],
  template: `
    <div class="shell">
      <aside class="side">
        <div class="brand">
          <div class="brand-mark">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M9 20 L16 8 L23 20 L19 20 L16 14 L13 20 Z" fill="white"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="name">Syncpoint</span>
            <span class="plan">Compliance · MVP</span>
          </div>
        </div>

        <ng-container *ngFor="let section of sections">
          <div class="section-title">{{ section.title }}</div>
          <a *ngFor="let item of section.items"
             class="link"
             [routerLink]="item.path"
             routerLinkActive="active">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span class="link-label">{{ item.label }}</span>
          </a>
        </ng-container>

        <div class="footer">
          <div class="status-line"><span class="dot"></span> All systems operational</div>
          <div style="margin-top:4px;">v0.1.0 · SOC 2 (DEMO)</div>
        </div>
      </aside>

      <section class="main">
        <header>
          <div class="breadcrumbs">
            <mat-icon style="font-size:16px;height:16px;width:16px;">home</mat-icon>
            <span class="separator">/</span>
            <span class="current">{{ me()?.organizationName ?? 'Workspace' }}</span>
          </div>
          <div style="flex:1"></div>

          <div class="actions">
            <button class="avatar-btn" [matMenuTriggerFor]="userMenu" *ngIf="me() as m">
              <span class="avatar">{{ initials() }}</span>
              <span class="who">
                <div class="name">{{ m.name }}</div>
                <div class="role">{{ m.role }}</div>
              </span>
              <mat-icon style="color:var(--color-text-muted);font-size:16px;height:16px;width:16px;">expand_more</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu" xPosition="before">
              <div class="user-menu-header" *ngIf="me() as m">
                <span class="avatar">{{ initials() }}</span>
                <div class="stack">
                  <div class="name">{{ m.name }}</div>
                  <div class="email">{{ m.email }}</div>
                  <div class="org">{{ m.organizationName }} · {{ m.role }}</div>
                </div>
              </div>
              <button mat-menu-item routerLink="/onboarding">
                <mat-icon>rocket_launch</mat-icon><span>{{ c.common.restartOnboarding }}</span>
              </button>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon><span>{{ c.common.signOut }}</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <div class="content"><router-outlet /></div>
      </section>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);
  private readonly store = inject(TokenStore);
  private readonly router = inject(Router);

  me = signal<Me | null>(null);

  initials = computed(() => {
    const m = this.me();
    if (!m) return '';
    return m.name.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
  });

  readonly sections: NavSection[] = [
    { title: CAPTIONS.shell.sidebarSectionOverview, items: [
        { path: '/dashboard',     label: CAPTIONS.shell.navDashboard,    icon: 'insights' },
        { path: '/onboarding',    label: CAPTIONS.shell.navOnboarding,   icon: 'rocket_launch' } ] },
    { title: CAPTIONS.shell.sidebarSectionEvidence, items: [
        { path: '/controls',      label: CAPTIONS.shell.navControls,     icon: 'checklist' },
        { path: '/evidence',      label: CAPTIONS.shell.navEvidence,     icon: 'description' } ] },
    { title: CAPTIONS.shell.sidebarSectionAutomation, items: [
        { path: '/integrations',  label: CAPTIONS.shell.navIntegrations, icon: 'hub' },
        { path: '/ask',           label: CAPTIONS.shell.navAsk,          icon: 'auto_awesome' } ] },
    { title: CAPTIONS.shell.sidebarSectionAudit, items: [
        { path: '/audit-package', label: CAPTIONS.shell.navExport,       icon: 'inventory_2' } ] },
  ];

  ngOnInit(): void {
    this.api.me().subscribe({ next: (m) => this.me.set(m) });
  }

  logout(): void {
    this.store.clear();
    this.router.navigateByUrl('/login');
  }
}
