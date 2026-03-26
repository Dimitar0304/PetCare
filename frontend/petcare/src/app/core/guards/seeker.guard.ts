import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from '../auth/auth.service';

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

