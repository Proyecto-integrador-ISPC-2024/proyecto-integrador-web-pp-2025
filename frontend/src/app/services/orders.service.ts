import { AuthService } from './../services/auth.service';
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { DashboardOrder } from '../interfaces/order';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { UserService } from './users.service';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private ordersUrl = 'http://localhost:8000/pedidos/';
  
  private statusFilterSubject = new BehaviorSubject<string>('TODOS');
  currentStatusFilter$ = this.statusFilterSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private http: HttpClient,
    private userService: UserService
  ) {} 
  
  updateStatusFilter(status: string): void {
    this.statusFilterSubject.next(status);
  }
  
  getCurrentStatusFilter(): string {
    return this.statusFilterSubject.getValue();
  }

  getAllOrders<T>(): Observable<DashboardOrder[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<T>(this.ordersUrl, { headers }) as Observable<DashboardOrder[]>;
  }

  getOrder(id_pedido: number): Observable<DashboardOrder> {
    const url = `${this.ordersUrl}${id_pedido}/`;
    return this.apiService.getWithAuth<DashboardOrder>(url).pipe(
      map(response => {
        return response;
      }),
      catchError(() => {
        return of({} as DashboardOrder);
      })
    );
  }

  cancelOrder(id_pedido: number): Observable<DashboardOrder> {
    const url = `${this.ordersUrl}${id_pedido}/`;
    return this.apiService.delete<DashboardOrder>(url).pipe(
      map(response => {
        return response;
      }),
      catchError(() => {
        return of({} as DashboardOrder);
      })
    );
  }
  
  getUsers(): Observable<any[]> {
    return this.userService.getAllUsers();
  }
  
  // Método para obtener todos los pedidos para usuario admin
  getAllOrdersAdmin(): Observable<DashboardOrder[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    
    return this.http.get<any[]>(this.ordersUrl, { headers }).pipe(
      map((orders: any[]) => {
        if (Array.isArray(orders)) {
          return orders;
        } else {
          return [];
        }
      }),
      catchError(() => {
        return of([]);
      })
    );
  }
  
// Método para actualizar el estado del pedido a enviado
  shipOrder(id_pedido: number): Observable<DashboardOrder> {
    const url = `${this.ordersUrl}${id_pedido}/enviar/`;
    return this.apiService.getWithAuth<DashboardOrder>(url).pipe(
      map(response => {
        return response;
      }),
      catchError(() => {
        return of({} as DashboardOrder);
      })
    );
  }
}