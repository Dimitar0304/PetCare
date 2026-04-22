import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from '../auth/auth.service';

/**
 * Route guard that restricts access to users with the `Seeker` role
 * (pet owners). Non-seekers are sent to the `/ads` listing.
 */
export const seekerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.getRole();
  if (role !== 'Seeker') {
    router.navigate(['/ads']);
    return false;
  }

  return true;
};

