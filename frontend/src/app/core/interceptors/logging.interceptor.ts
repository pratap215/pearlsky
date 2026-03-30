import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = Date.now();
  // Shorten URL for readability in console
  const shortUrl = req.url.replace(/^https?:\/\/[^/]+/, '');

  console.log(`%c[HTTP ▶] ${req.method} ${shortUrl}`, 'color:#2196F3;font-weight:bold');

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        const elapsed = Date.now() - startTime;
        const color = event.status < 300 ? '#4CAF50' : '#FF9800';
        console.log(
          `%c[HTTP ✔] ${req.method} ${shortUrl} → ${event.status} (${elapsed}ms)`,
          `color:${color};font-weight:bold`
        );
      }
    }),
    catchError(err => {
      const elapsed = Date.now() - startTime;
      console.group(`%c[HTTP ✖] ${req.method} ${shortUrl} → ${err.status} (${elapsed}ms)`, 'color:#F44336;font-weight:bold');
      console.error('Status     :', err.status, err.statusText);
      console.error('URL        :', req.url);
      console.error('Error body :', err.error);
      if (err.error?.errors) {
        console.error('Validation :', err.error.errors);
      }
      console.error('Full error :', err);
      console.groupEnd();
      return throwError(() => err);
    })
  );
};
