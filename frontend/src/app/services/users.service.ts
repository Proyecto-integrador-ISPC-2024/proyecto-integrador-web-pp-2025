import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiBaseUrl = 'http://127.0.0.1:8000/usuarios/'; 

  constructor(private http: HttpClient, private authService: AuthService) {}

  getToken(): string {
    return this.authService.getToken() || ''; 
  }
  
  getUserId(): string {
    const user = this.getCurrentUser();
    return user?.id_usuario || '';
  }
  
  // Configurar las cabeceras para las peticiones
  getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
  }
  // Obtener los datos del usuario
  getUserData(): Observable<any> {
    const url = `${this.apiBaseUrl}${this.getUserId()}/`;
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      catchError((error) => this.handleError(error)) 
    );
  }

  // Actualizar los datos de un campo del usuario
  updateUserData(field: string, value: any): Observable<any> {
    const url = `${this.apiBaseUrl}${this.getUserId()}/`;
    const payload = { [field]: value };
    return this.http.patch<any>(url, payload, { headers: this.getHeaders() }).pipe(
      catchError((error) => this.handleError(error)) 
    );
  }

  private handleError(error: any) {
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
  
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiBaseUrl, { headers: this.getHeaders() }).pipe(
      catchError((error) => this.handleError(error))
    );
  }
  
  getCurrentUser(): any {
    return this.authService.getCurrentUser();
  }
  
  // Método para obtener el rol del usuario actual
  getUserRole(): string {
    const user = this.getCurrentUser();
    return user?.rol || '';
  }

  // Método para crear un usuario cliente
  createUser(userData: any): Observable<any> {
    return this.http.post<any>(this.apiBaseUrl, userData, { headers: this.getHeaders() }).pipe(
      catchError((error) => this.handleError(error))
    );
  }
}

