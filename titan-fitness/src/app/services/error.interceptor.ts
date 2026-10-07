import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { PopupService } from './popup.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const popup = inject(PopupService);
  const isPageLoad = req.method === 'GET';

  const request = req.clone({
    setHeaders: { Authorization: 'Bearer titan-demo-token' },
  });

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        case 0:
          popup.error("Can't reach the server. Check your connection.");
          break;
        case 400:
          if (!err.error?.fields) popup.error(err.error?.message ?? 'Invalid request.');
          break;
        case 401:
          popup.error('Your session has expired.');
          break;
        case 403:
          if (!isPageLoad) popup.error("You don't have permission to do this.");
          break;
        case 404:
          if (!isPageLoad) popup.error('The item no longer exists.');
          break;
        case 409:
          popup.error(err.error?.message ?? 'This item already exists.');
          break;
        case 500:
        case 502:
        case 503:
          popup.error('Something went wrong. Please try again.');
          break;
      }
      return throwError(() => err);
    }),
  );
};
