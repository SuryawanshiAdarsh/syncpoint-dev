import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '@core/api/api.service';
import { Integration } from '@core/api/api.types';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiToastComponent,
  UiBadgeComponent,
  UiButtonComponent,
  UiProviderLogoComponent,
  ProviderMeta,
  PROVIDER_CATALOG,
} from '@ui';

@Component({
  standalone: true,
  selector: 'app-integrations',
  imports: [
    CommonModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatIconModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent,
    UiToastComponent, UiBadgeComponent, UiButtonComponent,
    UiProviderLogoComponent,
  ],
  styles: [`
    .providers {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }
    @media (max-width: 900px) { .providers { grid-template-columns: 1fr; } }

    .tile {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      display: flex; gap: var(--space-4); align-items: flex-start;
      transition: all 120ms var(--ease-out);
    }
    .tile.available:hover { box-shadow: var(--shadow-md); border-color: var(--color-border-strong); }
    .tile.disabled { opacity: 0.65; }

    .tile-body { flex: 1; min-width: 0; }
    .tile-head {
      display: flex; align-items: center;
      gap: var(--space-2);
      margin-bottom: 4px;
    }
    .tile-title { font-size: var(--text-lg); font-weight: var(--weight-semibold); }
    .tile-desc {
      color: var(--color-text-secondary);
      font-size: var(--text-base);
      line-height: 1.55;
      margin-bottom: var(--space-3);
    }

    .scopes {
      display: flex; flex-wrap: wrap;
      gap: var(--space-1);
      margin-bottom: var(--space-4);
    }
    .scope {
      padding: 2px 8px;
      background: var(--color-neutral-soft);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--color-neutral-text);
    }

    .connect-form {
      display: grid;
      grid-template-columns: 1fr 2fr auto;
      gap: var(--space-3);
      align-items: end;
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-divider);
    }
    @media (max-width: 700px) { .connect-form { grid-template-columns: 1fr; } }

    .connection {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-4);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }
    .connection + .connection { margin-top: var(--space-2); }
    .connection .info { flex: 1; min-width: 0; }
    .connection .name { font-weight: var(--weight-semibold); font-size: var(--text-md); }
    .connection .meta {
      color: var(--color-text-muted); font-size: var(--text-sm); margin-top: 4px;
      display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;
    }
    .connection .test-msg { color: var(--color-text-muted); font-size: var(--text-sm); margin-top: 6px; }
    .connection .actions { display: flex; gap: var(--space-2); align-items: center; }

    /* Force form-field height to match ui-button so the connect row aligns cleanly */
    ::ng-deep .connect-form .mat-mdc-form-field .mat-mdc-text-field-wrapper { height: 44px; }
    ::ng-deep .connect-form .mat-mdc-form-field .mat-mdc-form-field-flex { align-items: center; height: 44px; }
    ::ng-deep .connect-form .mat-mdc-form-field .mat-mdc-form-field-infix {
      padding-top: 10px !important; padding-bottom: 10px !important; min-height: unset;
    }
  `],
  template: `
    <div class="page">
      <ui-page-header
        eyebrow="Automation"
        title="Integrations"
        subtitle="Connect the systems your evidence lives in. All credentials are envelope-encrypted and never returned by the API.">
      </ui-page-header>

      <div class="providers">
        <div *ngFor="let p of catalog" class="tile"
             [class.available]="p.available"
             [class.disabled]="!p.available">
          <ui-provider-logo [provider]="p.key" size="md"></ui-provider-logo>
          <div class="tile-body">
            <div class="tile-head">
              <span class="tile-title">{{ p.name }}</span>
              <ui-badge [variant]="p.available ? 'success' : 'pending'" size="sm">
                {{ p.available ? 'Available' : 'Coming soon' }}
              </ui-badge>
            </div>
            <div class="tile-desc">{{ p.description }}</div>

            <div class="scopes" *ngIf="p.scopes?.length">
              <span class="scope" *ngFor="let s of p.scopes">{{ s }}</span>
            </div>

            <div class="connect-form" *ngIf="p.key === 'GITHUB' && p.available">
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Display name</mat-label>
                <input matInput [(ngModel)]="displayName" placeholder="Company GitHub">
              </mat-form-field>
              <mat-form-field appearance="outline" subscriptSizing="dynamic">
                <mat-label>Personal Access Token</mat-label>
                <input matInput type="password" [(ngModel)]="token" placeholder="github_pat_...">
              </mat-form-field>
              <ui-button variant="primary"
                         [disabled]="!token"
                         [loading]="connecting()"
                         loadingText="Connecting…"
                         (click)="connect()">
                <mat-icon>link</mat-icon>Connect
              </ui-button>
            </div>
          </div>
        </div>
      </div>

      <ui-card [title]="'Your connections'" [caption]="items().length + ' configured'">
        <div *ngIf="items().length; else emptyConn">
          <div *ngFor="let i of items()" class="connection">
            <ui-provider-logo [provider]="i.provider" size="md"></ui-provider-logo>
            <div class="info">
              <div class="name">{{ i.displayName ?? i.provider }}</div>
              <div class="meta">
                <ui-badge [variant]="statusVariant(i.status)" size="sm">{{ i.status }}</ui-badge>
                <span *ngIf="i.lastCollectionAt">· Last collected {{ i.lastCollectionAt | date:'MMM d, h:mm a' }}</span>
                <span *ngIf="i.lastTestedAt && !i.lastCollectionAt">· Last tested {{ i.lastTestedAt | date:'MMM d, h:mm a' }}</span>
              </div>
              <div class="test-msg" *ngIf="i.lastTestMessage">{{ i.lastTestMessage }}</div>
            </div>
            <div class="actions">
              <ui-button variant="ghost"   size="sm" (click)="test(i.id)">
                <mat-icon>wifi_tethering</mat-icon>Test
              </ui-button>
              <ui-button variant="primary" size="sm" (click)="collect(i.id)">
                <mat-icon>sync</mat-icon>Collect
              </ui-button>
              <ui-button variant="danger"  size="sm" (click)="disconnect(i.id)">
                <mat-icon>link_off</mat-icon>Disconnect
              </ui-button>
            </div>
          </div>
        </div>

        <ng-template #emptyConn>
          <ui-empty-state
            icon="hub"
            title="No integrations configured"
            description="Connect GitHub above to start collecting evidence automatically.">
          </ui-empty-state>
        </ng-template>
      </ui-card>

      <ui-toast *ngIf="msg()" variant="success">{{ msg() }}</ui-toast>
      <ui-toast *ngIf="err()" variant="error">{{ err() }}</ui-toast>
    </div>
  `,
})
export class IntegrationsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly catalog: ReadonlyArray<ProviderMeta> = PROVIDER_CATALOG;

  items = signal<Integration[]>([]);
  token = '';
  displayName = '';
  connecting = signal(false);
  msg = signal<string | null>(null);
  err = signal<string | null>(null);

  ngOnInit(): void { this.reload(); }

  connect(): void {
    this.connecting.set(true);
    this.msg.set(null); this.err.set(null);
    this.api.connectGitHub({ token: this.token, displayName: this.displayName || undefined }).subscribe({
      next: (i) => {
        this.msg.set(`Connected — ${i.lastTestMessage ?? i.status}`);
        this.token = ''; this.displayName = '';
        this.reload();
      },
      error: (e) => this.err.set(e?.error?.message ?? 'Connection failed'),
      complete: () => this.connecting.set(false),
    });
  }

  test(id: string): void {
    this.api.testIntegration(id).subscribe(r => {
      if (r.ok) { this.msg.set(`OK — ${r.message}`); this.err.set(null); }
      else     { this.err.set(`Failed — ${r.message}`); this.msg.set(null); }
      this.reload();
    });
  }
  collect(id: string): void {
    this.api.collectIntegration(id).subscribe(r => {
      this.msg.set(`Collection queued (${r.collectionRunId.slice(0, 8)}…)`);
      this.err.set(null);
    });
  }
  disconnect(id: string): void {
    this.api.disconnectIntegration(id).subscribe(() => { this.msg.set('Disconnected.'); this.reload(); });
  }

  statusVariant(s: string): 'connected' | 'pending' | 'error' | 'disconnected' {
    return ({ CONNECTED: 'connected', PENDING: 'pending', ERROR: 'error', DISCONNECTED: 'disconnected' } as const)[s]
      ?? 'pending';
  }

  private reload(): void {
    this.api.integrations().subscribe(list => this.items.set(list));
  }
}
