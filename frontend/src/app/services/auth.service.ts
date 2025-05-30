import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHandler, HttpRequest, HttpEvent } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, interval, Subscription } from 'rxjs';
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
export class AuthService implements OnDestroy {
  private url = 'http://127.0.0.1:8000';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<any>(null);
  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private tokenCheckInterval: Subscription | null = null;
  
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthStatus();
    this.startTokenCheck();
  }

  ngOnDestroy() {
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
    }
  }

  private startTokenCheck() {
    this.tokenCheckInterval = interval(10000).subscribe(() => {
      this.checkAndRefreshToken();
    });
  }

  private checkAndRefreshToken() {
    const token = this.getToken();
    if (!token) return;

    const isExpired = this.isTokenExpired(token);
    const isExpiringSoon = this.isTokenExpiringSoon();

    if (isExpired || isExpiringSoon) {
      this.refreshToken().subscribe({
        next: (newToken) => {
          if (newToken) {
            this.isAuthenticatedSubject.next(true);
            const userData = this.decodeToken(newToken);
            this.currentUserSubject.next(userData);
          } else {
            this.logout();
          }
        },
        error: () => {
          this.logout();
        }
      });
    }
  }

  private checkAuthStatus(): void {
    const token = this.getToken();
    
    if (token) {
      const isExpired = this.isTokenExpired(token);
      
      if (!isExpired) {
        this.isAuthenticatedSubject.next(true);
        const userData = this.decodeToken(token);
        this.currentUserSubject.next(userData);
      } else {
        this.refreshToken().subscribe({
          next: (newToken) => {
            if (newToken) {
              this.isAuthenticatedSubject.next(true);
              const userData = this.decodeToken(newToken);
              this.currentUserSubject.next(userData);
            } else {
              this.logout();
            }
          },
          error: () => {
            this.logout();
          }
        });
      }
    } else {
      this.logout();
    }
  }

    // Método para la utilidad de los tokens
    private isTokenExpired(token: string): boolean {
      try {
        const decoded = this.decodeToken(token);
        const isExpired = decoded.exp ? decoded.exp * 1000 < Date.now() : true;
        return isExpired;
      } catch (error) {
        return true;
      }
    }
  
    private decodeToken(token: string): any {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (error) {
        return null;
      }
    }
  
    private obfuscateToken(token: string): string {
      if (!token) return '';
      const base64 = btoa(token);
      return base64.split('').reverse().join('');
    }
  
    private deobfuscateToken(obfuscatedToken: string): string {
      if (!obfuscatedToken) return '';
      try {
        const reversed = obfuscatedToken.split('').reverse().join('');
        return atob(reversed);
      } catch {
        return '';
      }
    }

  // Métodos de autenticación
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.url}/login/`, credentials).pipe(
      map(response => {
        if (response && response.token) {
          localStorage.setItem('access_token', this.obfuscateToken(response.token));
          localStorage.setItem('refresh_token', this.obfuscateToken(response.refresh_token));
          
          const userData = this.decodeToken(response.token);
          this.currentUserSubject.next(userData);
          this.isAuthenticatedSubject.next(true);
        }
        return response;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const isExpired = token ? this.isTokenExpired(token) : true;
    return !!token && !isExpired;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  // Método para el manejo de los tokens
  getToken(): string | null {
    const obfuscatedToken = localStorage.getItem('access_token');
    return obfuscatedToken ? this.deobfuscateToken(obfuscatedToken) : null;
  }

  getRefreshToken(): string | null {
    const obfuscatedToken = localStorage.getItem('refresh_token');
    return obfuscatedToken ? this.deobfuscateToken(obfuscatedToken) : null;
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    
    return this.http.post<any>(`${this.url}/api/token/refresh/`, { refresh: refreshToken })
      .pipe(
        tap((response) => {
          if (response && response.access) {
            localStorage.setItem('access_token', this.obfuscateToken(response.access));
            const userData = this.decodeToken(response.access);
            this.currentUserSubject.next(userData);
          }
        }),
        catchError(error => {
          return throwError(() => error);
        }),
        map(response => response && response.access ? response.access : null)
      );
  }

  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      const decoded = this.decodeToken(token);
      if (!decoded.exp) return true;
      
      const twoMinutes = 2 * 60 * 1000;
      return decoded.exp * 1000 - Date.now() < twoMinutes;
    } catch {
      return true;
    }
  }

  // Métodos de usuario
  getUserId(): string {
    const user = this.getCurrentUser();
    return user?.id_usuario || '';
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(userData: any): void {
    this.currentUserSubject.next(userData);
  }

  getUserRole(): string {
    const token = this.getToken();
    if (token) {
      const decodedToken = this.decodeToken(token);
      return decodedToken?.rol || '';
    }
    return '';
  }
  
  createUser(userData: User): Observable<User> {
    return this.http.post<User>(`${this.url}/usuarios/`, userData);
  }

  // manejo de errores http
  handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.refreshTokenInProgress) {
      this.refreshTokenInProgress = true;
      this.refreshTokenSubject.next(null);

      return this.refreshToken().pipe(
        switchMap((newAccessToken: string) => {
          this.refreshTokenInProgress = false;
          this.refreshTokenSubject.next(newAccessToken);
          return next.handle(this.addToken(request, newAccessToken));
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