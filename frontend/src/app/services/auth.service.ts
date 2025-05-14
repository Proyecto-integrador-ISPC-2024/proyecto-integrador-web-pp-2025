import { Injectable } from '@angular/core';
import { HttpClient, HttpHandler, HttpRequest, HttpEvent } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, map, switchMap, catchError, filter, take } from 'rxjs/operators';
import { User } from '../interfaces/user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refresh_token: string;
  usuario: {
    id_usuario: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private url = 'http://127.0.0.1:8000'; // URL base correcta
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = localStorage.getItem('access_token');
    this.isAuthenticatedSubject.next(!!token);
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    // Usar la URL correcta con /login/
    return this.http.post<LoginResponse>(`${this.url}/login/`, credentials).pipe(
      map(response => {
        console.log('Respuesta del servidor:', response);
        if (response && response.token) {
          localStorage.setItem('access_token', response.token);
          localStorage.setItem('refresh_token', response.refresh_token);
          localStorage.setItem('currentUser', JSON.stringify(response.usuario));
          this.isAuthenticatedSubject.next(true);
        }
        return response;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('currentUser');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getUserId(): string {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.id_usuario || '';
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  createUser(userData: User): Observable<User> {
    return this.http.post<User>(`${this.url}/usuarios/`, userData);
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<any>(`${this.url}/api/token/refresh/`, { refresh: refreshToken })
      .pipe(
        tap((response) => {
          if (response && response.access) {
            localStorage.setItem('access_token', response.access);
          }
        })
      );
  }

  handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.refreshTokenInProgress) {
      this.refreshTokenInProgress = true;
      this.refreshTokenSubject.next(null);

      return this.refreshToken().pipe(
        switchMap((token: any) => {
          this.refreshTokenInProgress = false;
          this.refreshTokenSubject.next(token.access);
          return next.handle(this.addToken(request, token.access));
        }),
        catchError((err) => {
          this.refreshTokenInProgress = false;
          this.logout();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}