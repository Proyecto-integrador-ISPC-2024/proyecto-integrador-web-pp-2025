import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminService } from '../services/admin.service';

export const AdminGuard: CanActivateFn = () => {
  const adminService = inject(AdminService);
  const router = inject(Router);

  if (adminService.isAdmin() || adminService.isSuperAdmin()) {
    return true;
  } else {
    router.navigate(['/unauthorized']);
    return false;
  }
};
