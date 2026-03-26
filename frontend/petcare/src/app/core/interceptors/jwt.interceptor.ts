import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../auth/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private readonly auth = inject(AuthService);
  private readonly apiBase = 'https://localhost:5001/api';

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.getToken();

    const isBackendCall = req.url.startsWith(this.apiBase);
    if (!token || !isBackendCall) {
      return next.handle(req);
    }

    if (req.headers.has('Authorization')) {
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
  }
}

