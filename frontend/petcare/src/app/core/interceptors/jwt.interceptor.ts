import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.getToken();

    // Match both absolute URLs (dev: https://localhost:5001/api)
    // and relative paths (prod Docker: /api)
    const apiBase = environment.apiBase;
    const isBackendCall = req.url.startsWith(apiBase) || req.url.startsWith('/api');

    if (!token || !isBackendCall) {
      return next.handle(req);
    }

    if (req.headers.has('Authorization')) {
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    );
  }
}

