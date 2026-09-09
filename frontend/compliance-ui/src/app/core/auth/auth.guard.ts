import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { TokenStore } from './token-store.service';
import { ApiService } from '../api/api.service';

export const authGuard: CanActivateFn = () => {
  const store = inject(TokenStore);
  const router = inject(Router);
  if (store.isAuthenticated()) return true;
  router.navigateByUrl('/login', { replaceUrl: true });
  return false;
};

export const publicGuard: CanActivateFn = () => {
  const store = inject(TokenStore);
  const router = inject(Router);
  if (!store.isAuthenticated()) return true;
  const api = inject(ApiService);
  return api.me().pipe(
    map(me => router.parseUrl(me.role === 'ACKNOWLEDGER' ? '/my-policies' : me.role === 'AUDITOR' ? '/auditor' : '/dashboard')),
    catchError(() => of(true)),
  );
};

/**
 * Forces a fresh org through /onboarding until it's marked complete. Evaluated once when the
 * authenticated shell is entered (Angular doesn't re-run a parent route's guard on child
 * navigation), not on every page click.
 */
export const onboardingGuard: CanActivateFn = (_route, state) => {
  if (state.url.startsWith('/onboarding')) return true;
  const api = inject(ApiService);
  const router = inject(Router);
  return api.me().pipe(
    map(me => (me.onboardingCompleted ? true : router.parseUrl('/onboarding'))),
    // /auth/me failing (expired/invalid token) must deny access, not silently allow it.
    catchError(() => of(router.parseUrl('/login'))),
  );
};

/**
 * Guards the /onboarding page itself (unlike onboardingGuard above, which only forces entry).
 * A not-yet-onboarded org must stay reachable for whoever that org's forced-first-run member is
 * (any role), but deliberately RESTARTING an already-completed onboarding is an OWNER/ADMIN-only
 * action -- same gate as Settings' admin sections. UX-level only; the real enforcement is
 * @PreAuthorize on POST /organizations/current/onboarding/complete server-side.
 */
export const onboardingRestartGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  return api.me().pipe(
    map(me => (!me.onboardingCompleted || me.role === 'OWNER' || me.role === 'ADMIN')
      ? true
      : router.parseUrl('/dashboard')),
    catchError(() => of(router.parseUrl('/login'))),
  );
};

/**
 * Gates the internal Platform Admin Console (Syncpoint-the-company's own view of its tenants).
 * This is a UX-level guard only — the backend independently enforces ROLE_PLATFORM_ADMIN on
 * every /admin/** endpoint, so a denied redirect here never substitutes for server-side auth.
 */
export const platformAdminGuard: CanActivateFn = () => {
  const api = inject(ApiService);
  const router = inject(Router);
  return api.me().pipe(
    map(me => (me.platformAdmin ? true : router.parseUrl('/dashboard'))),
    catchError(() => of(router.parseUrl('/login'))),
  );
};

/**
 * ACKNOWLEDGER is a restricted real login (see Role in api.types.ts) meant to see ONLY the
 * My Policies page — this is a UX-level redirect only; the backend independently enforces the
 * same restriction on every /api/v1/** endpoint (see SecurityConfig.ACKNOWLEDGER_ALLOWED_ENDPOINTS),
 * so a bug here can never grant broader access than the server allows.
 */
export const acknowledgerGuard: CanActivateFn = (_route, state) => {
  if (state.url.startsWith('/my-policies')) return true;
  const api = inject(ApiService);
  const router = inject(Router);
  return api.me().pipe(
    map(me => (me.role === 'ACKNOWLEDGER' ? router.parseUrl('/my-policies') : true)),
    catchError(() => of(router.parseUrl('/login'))),
  );
};

/**
 * AUDITOR is a restricted real login (invited CPA firm member) meant to see ONLY the auditor
 * workspace — this is a UX-level redirect only; the backend independently enforces the same
 * restriction on every /api/v1/** endpoint (see SecurityConfig.AUDITOR_ALLOWED_ENDPOINTS), so a
 * bug here can never grant broader access than the server allows.
 */
export const auditorGuard: CanActivateFn = (_route, state) => {
  if (state.url.startsWith('/auditor')) return true;
  const api = inject(ApiService);
  const router = inject(Router);
  return api.me().pipe(
    map(me => (me.role === 'AUDITOR' ? router.parseUrl('/auditor') : true)),
    catchError(() => of(router.parseUrl('/login'))),
  );
};
