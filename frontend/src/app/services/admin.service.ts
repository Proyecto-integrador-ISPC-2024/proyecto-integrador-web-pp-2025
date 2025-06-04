import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = 'http://127.0.0.1:8000';
  private adminApiUrl = `${this.baseUrl}/administrador/`;

  constructor(private apiService: ApiService, private authService: AuthService) {}

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
    try {
      const user = this.authService.getCurrentUser();
      return user?.rol === 'ADMIN' && user?.is_staff === true;
    } catch {
      return false;
    }
  }

  // Verificar si el usuario actual es superadministrador
  isSuperAdmin(): boolean {
    try {
      const user = this.authService.getCurrentUser();
      return user?.rol === 'ADMIN' && user?.is_staff === true && user?.is_superuser === true;
    } catch {
      return false;
    }
  }
} 