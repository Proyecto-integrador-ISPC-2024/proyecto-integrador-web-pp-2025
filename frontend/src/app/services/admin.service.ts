import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = 'http://127.0.0.1:8000';
  private adminApiUrl = `${this.baseUrl}/administrador/`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  // Obtener todos los usuarios
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.adminApiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
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

    return this.http.post<any>(this.adminApiUrl, adminData, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error al crear usuario:', error);
        return this.handleError(error);
      })
    );
  }

  // Desactivar un usuario por ID
  deactivateUserById(userId: string): Observable<any> {
    const url = `${this.adminApiUrl}${userId}/`;
    return this.http.delete<any>(url, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
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