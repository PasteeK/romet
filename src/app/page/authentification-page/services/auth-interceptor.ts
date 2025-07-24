import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthToken } from './auth-token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthToken);
  const token = authService.getToken();

  // Ajouter le token aux requêtes (sauf login)
  if (token && !req.url.includes('/login')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};