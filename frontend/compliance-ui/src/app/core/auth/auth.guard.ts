import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStore } from './token-store.service';

export const authGuard: CanActivateFn = () => {
  const store = inject(TokenStore);
  const router = inject(Router);
  if (store.isAuthenticated()) return true;
  router.navigateByUrl('/login');
  return false;
};

export const publicGuard: CanActivateFn = () => {
  const store = inject(TokenStore);
  const router = inject(Router);
  if (!store.isAuthenticated()) return true;
  router.navigateByUrl('/dashboard');
  return false;
};
