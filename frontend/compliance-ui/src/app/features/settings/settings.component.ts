import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { ApiService } from '../../core/api/api.service';
import { Me, Organization, Member, Integration, Role } from '../../core/api/api.types';
import { CAPTIONS } from '@captions';
import {
  UiPageHeaderComponent,
  UiCardComponent,
  UiEmptyStateComponent,
  UiToastComponent,
  UiButtonComponent,
  UiBadgeComponent,
} from '@ui';

type ScheduleValue = 'MANUAL' | 'DAILY' | 'WEEKLY';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
    UiPageHeaderComponent, UiCardComponent, UiEmptyStateComponent, UiToastComponent,
    UiButtonComponent, UiBadgeComponent,
  ],
  styles: [`
    .row { display: flex; gap: var(--space-3); align-items: end; flex-wrap: wrap; }
    .row + .row { margin-top: var(--space-4); }
    .member-row, .integration-row {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--color-divider);
    }
    .member-row:last-child, .integration-row:last-child { border-bottom: none; }
    .member-row .who, .integration-row .who { flex: 1; min-width: 0; }
    .member-row .name, .integration-row .name { font-weight: var(--weight-medium); }
    .member-row .email, .integration-row .meta { color: var(--color-text-muted); font-size: var(--text-sm); }
    .invite-form {
      display: grid;
      grid-template-columns: 1.2fr 1.4fr 1fr 1fr auto;
      gap: var(--space-3);
      align-items: end;
      padding-bottom: var(--space-5);
      margin-bottom: var(--space-5);
      border-bottom: 1px solid var(--color-divider);
    }
    @media (max-width: 900px) { .invite-form { grid-template-columns: 1fr; } }
  `],
  template: `
    <div class="page">
      <ui-page-header [eyebrow]="c.settings.eyebrow" [title]="c.settings.title" [subtitle]="c.settings.subtitle"></ui-page-header>

      <ng-container *ngIf="canManage(); else restricted">
        <ui-card [title]="c.settings.generalTitle" [caption]="c.settings.generalCaption">
          <div class="row">
            <mat-form-field appearance="outline" style="flex:1;min-width:260px;" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.orgNameLabel }}</mat-label>
              <input matInput [(ngModel)]="orgName" [disabled]="!isOwner()">
            </mat-form-field>
            <ui-button variant="primary" [disabled]="!isOwner() || !orgName.trim()" [loading]="savingOrg()"
                       [loadingText]="c.settings.savingButton" (click)="saveOrg()">
              {{ c.settings.saveButton }}
            </ui-button>
          </div>
        </ui-card>

        <ui-card [title]="c.settings.membersTitle" [caption]="c.settings.membersCaption" style="display:block;margin-top:var(--space-4);">
          <div class="invite-form">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.inviteNameLabel }}</mat-label>
              <input matInput [(ngModel)]="inviteName">
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.inviteEmailLabel }}</mat-label>
              <input matInput type="email" [(ngModel)]="inviteEmail">
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.invitePasswordLabel }}</mat-label>
              <input matInput type="password" [(ngModel)]="invitePassword">
            </mat-form-field>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>{{ c.settings.inviteRoleLabel }}</mat-label>
              <mat-select [(ngModel)]="inviteRole">
                <mat-option value="ADMIN">Admin</mat-option>
                <mat-option value="REVIEWER">Reviewer</mat-option>
                <mat-option value="VIEWER">Viewer</mat-option>
              </mat-select>
            </mat-form-field>
            <ui-button variant="primary" [loading]="inviting()" [loadingText]="c.settings.invitingButton"
                       [disabled]="!inviteEmail || !inviteName || invitePassword.length < 12"
                       (click)="invite()">
              {{ c.settings.inviteButton }}
            </ui-button>
          </div>

          <div *ngFor="let m of members()" class="member-row">
            <div class="who">
              <div class="name">{{ m.name }}</div>
              <div class="email">{{ m.email }}</div>
            </div>
            <mat-form-field appearance="outline" style="width:150px;" subscriptSizing="dynamic" *ngIf="isOwner(); else roleBadge">
              <mat-select [ngModel]="m.role" (ngModelChange)="changeRole(m, $event)">
                <mat-option value="OWNER">Owner</mat-option>
                <mat-option value="ADMIN">Admin</mat-option>
                <mat-option value="REVIEWER">Reviewer</mat-option>
                <mat-option value="VIEWER">Viewer</mat-option>
              </mat-select>
            </mat-form-field>
            <ng-template #roleBadge><ui-badge variant="info">{{ m.role }}</ui-badge></ng-template>
          </div>
        </ui-card>

        <ui-card [title]="c.settings.automationTitle" [caption]="c.settings.automationCaption" style="display:block;margin-top:var(--space-4);">
          <ng-container *ngIf="integrations().length; else emptyIntegrations">
            <div *ngFor="let i of integrations()" class="integration-row">
              <div class="who">
                <div class="name">{{ i.displayName ?? i.provider }}</div>
                <div class="meta">{{ i.provider }} · {{ i.status }}</div>
              </div>
              <mat-form-field appearance="outline" style="width:170px;" subscriptSizing="dynamic">
                <mat-label>{{ c.settings.scheduleLabel }}</mat-label>
                <mat-select [ngModel]="i.schedule" (ngModelChange)="changeSchedule(i, $event)">
                  <mat-option value="MANUAL">{{ c.settings.scheduleManual }}</mat-option>
                  <mat-option value="DAILY">{{ c.settings.scheduleDaily }}</mat-option>
                  <mat-option value="WEEKLY">{{ c.settings.scheduleWeekly }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </ng-container>
          <ng-template #emptyIntegrations>
            <ui-empty-state icon="hub" [title]="c.settings.automationEmptyTitle" [description]="c.settings.automationEmptyMessage"></ui-empty-state>
          </ng-template>
        </ui-card>
      </ng-container>

      <ng-template #restricted>
        <ui-card>
          <ui-empty-state icon="lock" [title]="c.settings.restrictedTitle" [description]="c.settings.restrictedMessage"></ui-empty-state>
        </ui-card>
      </ng-template>

      <ui-toast *ngIf="msg()" variant="success">{{ msg() }}</ui-toast>
      <ui-toast *ngIf="err()" variant="error">{{ err() }}</ui-toast>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  readonly c = CAPTIONS;
  private readonly api = inject(ApiService);

  me = signal<Me | null>(null);
  org = signal<Organization | null>(null);
  members = signal<Member[]>([]);
  integrations = signal<Integration[]>([]);

  orgName = '';
  savingOrg = signal(false);

  inviteName = '';
  inviteEmail = '';
  invitePassword = '';
  inviteRole: Role = 'REVIEWER';
  inviting = signal(false);

  msg = signal<string | null>(null);
  err = signal<string | null>(null);

  canManage = computed(() => {
    const r = this.me()?.role;
    return r === 'OWNER' || r === 'ADMIN';
  });
  isOwner = computed(() => this.me()?.role === 'OWNER');

  ngOnInit(): void {
    this.api.me().subscribe(m => this.me.set(m));
    this.reload();
  }

  saveOrg(): void {
    this.savingOrg.set(true);
    this.api.updateOrganization({ name: this.orgName.trim() }).subscribe({
      next: (o) => {
        this.org.set(o);
        this.msg.set(this.c.settings.orgUpdatedToast);
        this.err.set(null);
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.settings.actionError),
      complete: () => this.savingOrg.set(false),
    });
  }

  invite(): void {
    this.inviting.set(true);
    this.api.addMember({
      email: this.inviteEmail, name: this.inviteName,
      password: this.invitePassword, role: this.inviteRole,
    }).subscribe({
      next: () => {
        this.msg.set(this.c.settings.memberAddedToast);
        this.err.set(null);
        this.inviteName = ''; this.inviteEmail = ''; this.invitePassword = ''; this.inviteRole = 'REVIEWER';
        this.reloadMembers();
      },
      error: (e) => this.err.set(e?.error?.message ?? this.c.settings.actionError),
      complete: () => this.inviting.set(false),
    });
  }

  changeRole(member: Member, role: Role): void {
    this.api.updateMemberRole(member.id, role).subscribe({
      next: () => { this.msg.set(this.c.settings.roleUpdatedToast); this.err.set(null); this.reloadMembers(); },
      error: (e) => { this.err.set(e?.error?.message ?? this.c.settings.actionError); this.reloadMembers(); },
    });
  }

  changeSchedule(integration: Integration, schedule: ScheduleValue): void {
    this.api.updateIntegrationSchedule(integration.id, schedule).subscribe({
      next: () => { this.msg.set(this.c.settings.scheduleUpdatedToast); this.err.set(null); this.reloadIntegrations(); },
      error: (e) => { this.err.set(e?.error?.message ?? this.c.settings.actionError); this.reloadIntegrations(); },
    });
  }

  private reload(): void {
    this.api.organization().subscribe(o => { this.org.set(o); this.orgName = o.name; });
    this.reloadMembers();
    this.reloadIntegrations();
  }
  private reloadMembers(): void { this.api.members().subscribe(list => this.members.set(list)); }
  private reloadIntegrations(): void { this.api.integrations().subscribe(list => this.integrations.set(list)); }
}
