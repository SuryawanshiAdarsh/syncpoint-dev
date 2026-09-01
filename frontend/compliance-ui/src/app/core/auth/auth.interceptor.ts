import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { TokenStore } from './token-store.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(TokenStore);
  const router = inject(Router);
  const token = store.accessToken;

  const authed = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authed).pipe(
    catchError((err) => {
      if (err.status === 401) {
        store.clear();
        router.navigateByUrl('/login');
      }
      return throwError(() => err);
    }),
  );
};
