import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from '../auth/auth.service';

/**
 * Route guard that allows activation only when the user is authenticated and
 * has the `Admin` role. Unauthenticated visitors are redirected to `/login`,
 * authenticated non-admins to `/ads`.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getToken()) {
    router.navigate(['/login']);
    return false;
  }

  if (auth.getRole() !== 'Admin') {
    router.navigate(['/ads']);
    return false;
  }

  return true;
};

