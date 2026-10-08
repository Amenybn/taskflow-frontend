import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from './toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message: string;
      if (err.status === 0) {
        message = 'Serveur injoignable : vérifiez que le backend est démarré.';
      } else if (err.error?.message) {
        message = err.error.message;
      } else {
        message = `Erreur ${err.status} : ${err.statusText || 'requête échouée'}`;
      }
      toast.error(message);
      return throwError(() => err);
    }),
  );
};
