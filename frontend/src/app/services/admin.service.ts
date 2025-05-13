import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = 'http://127.0.0.1:8000';
  private adminApiUrl = `${this.baseUrl}/administrador/`;

  constructor(private apiService: ApiService) {}

  // Obtener todos los usuarios
  getAllUsers(): Observable<any[]> {
    return this.apiService.getWithAuth<any[]>(this.adminApiUrl);
  }

  // Crear un usuario administrador
  createUser(userData: any): Observable<any> {
    const adminData = {
      ...userData,
      is_staff: true,
      is_superuser: false,
      is_active: true,
      rol: userData.rol || 'CLIENTE'
    };

    return this.apiService.postWithAuth<any>(this.adminApiUrl, adminData);
  }

  // Desactivar un usuario por ID
  deactivateUserById(userId: string): Observable<any> {
    const url = `${this.adminApiUrl}${userId}/`;
    return this.apiService.delete<any>(url);
  }

  // Verificar si el usuario actual es administrador
  isAdmin(): boolean {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!user) {
      return false;
    }
    
    const hasAdminRole = user.rol === 'ADMIN';
    const isStaff = user.is_staff === true || user.is_staff === 1 || user.is_staff === '1';
    
    return hasAdminRole && isStaff;
  }

  // Verificar si el usuario actual es superadministrador
  isSuperAdmin(): boolean {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!user) {
      return false;
    }
    
    const hasAdminRole = user.rol === 'ADMIN';
    const isStaff = user.is_staff === true || user.is_staff === 1 || user.is_staff === '1';
    const isSuperuser = user.is_superuser === true || user.is_superuser === 1 || user.is_superuser === '1';
    
    return hasAdminRole && isStaff && isSuperuser;
  }
} 