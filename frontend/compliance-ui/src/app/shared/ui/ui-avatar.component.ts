import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Gradient avatar with initials.
 *
 * Usage:
 *   <ui-avatar [name]="user.name" size="md"></ui-avatar>
 */
@Component({
  standalone: true,
  selector: 'ui-avatar',
  imports: [CommonModule],
  styles: [`
    :host { display: inline-flex; }
    .avatar {
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      display: grid; place-items: center;
      font-weight: 600;
      flex-shrink: 0;
      font-family: var(--font-sans);
    }
    .sm { width: 24px; height: 24px; font-size: 10px; }
    .md { width: 32px; height: 32px; font-size: 12px; }
    .lg { width: 44px; height: 44px; font-size: 15px; }
    .xl { width: 64px; height: 64px; font-size: 22px; }
  `],
  template: `<span class="avatar {{ size }}">{{ initials() }}</span>`,
})
export class UiAvatarComponent {
  @Input({ required: true }) set name(value: string) { this._name.set(value ?? ''); }
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  private readonly _name = signal('');
  readonly initials = computed(() => {
    const parts = this._name().trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '?';
    return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
  });
}
