import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiBaseUrl = 'http://127.0.0.1:8000/usuarios/'; 

  constructor(private http: HttpClient) {}

  // Obtener el token desde localStorage
  getToken(): string {
    return localStorage.getItem('access_token') || ''; // Retorna una cadena vacía si no se encuentra el token
  }
  
  // Obtener el ID del usuario desde localStorage
  getUserId(): string {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.id_usuario || '';  // ← usa la clave correcta
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
      catchError((error) => this.handleError(error)) // Manejo de errores
    );
  }

  // Actualizar los datos de un campo del usuario
  updateUserData(field: string, value: any): Observable<any> {
    const url = `${this.apiBaseUrl}${this.getUserId()}/`;
    const payload = { [field]: value };
    return this.http.patch<any>(url, payload, { headers: this.getHeaders() }).pipe(
      catchError((error) => this.handleError(error)) // Manejo de errores
    );
  }

  // Método para manejar errores de las peticiones HTTP
  private handleError(error: any) {
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
  
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiBaseUrl, { headers: this.getHeaders() }).pipe(
      catchError((error) => this.handleError(error))
    );
  }
}
