import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.getUser();

    // 1. If no user session exists, go to login
    if (!user) {
      return router.createUrlTree(['/login']);
    }

    // 2. Check the role. C# usually returns 'roleName' or 'role'
    // Ensure this matches the property name in your user object
    const rawRole = user?.role || 
                    user?.roleName || 
                    user?.['http://microsoft.com'] || 
                    '';

    const userRoleNormalized = String(rawRole).trim().toLowerCase();

    // 3. Convert all expected allowed roles array elements to lowercase for a guaranteed match
    const lowerAllowedRoles = allowedRoles.map(r => r.trim().toLowerCase());

    if (lowerAllowedRoles.includes(userRoleNormalized)) {
      return true;
    }


    // 3. Unauthorized role: redirect to login
    return router.createUrlTree(['/login']);
  };
};
