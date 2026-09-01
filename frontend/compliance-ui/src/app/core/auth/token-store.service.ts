import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'syncpoint.accessToken';
const REFRESH_KEY = 'syncpoint.refreshToken';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private accessTokenSig = signal<string | null>(this.readLocal(TOKEN_KEY));

  get accessToken(): string | null {
    return this.accessTokenSig();
  }

  get refreshToken(): string | null {
    return this.readLocal(REFRESH_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.accessTokenSig();
  }

  setTokens(access: string, refresh?: string | null): void {
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    this.accessTokenSig.set(access);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this.accessTokenSig.set(null);
  }

  private readLocal(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  }
}
