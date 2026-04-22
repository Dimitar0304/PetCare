import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

/**
 * HTTP interceptor that attaches `Authorization: Bearer <token>` to every
 * outbound request that targets the backend API. Requests to third-party
 * origins or requests that already carry an `Authorization` header are
 * forwarded untouched.
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);

  /**
   * Adds the bearer token to backend requests when a token is present.
   * Backend calls are detected both by full API base URL (dev) and by the
   * `/api` prefix (production behind nginx).
   */
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

