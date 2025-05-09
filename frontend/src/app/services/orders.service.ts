import { AuthService } from './../services/auth.service';
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { DashboardOrder } from '../interfaces/order';
import { HttpHeaders, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private ordersUrl = 'http://127.0.0.1:8000/pedidos/';
  
  private statusFilterSubject = new BehaviorSubject<string>('TODOS');
  currentStatusFilter$ = this.statusFilterSubject.asObservable();

  constructor(private apiService: ApiService, private authService: AuthService, private http: HttpClient) {} 

  getUsers(): Observable<any[]> {
    return this.apiService.getWithAuth<any[]>('http://127.0.0.1:8000/usuarios/');
  }
  
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
    return this.apiService.getWithAuth<DashboardOrder>(url)
      .pipe(
        catchError(this.handleError<DashboardOrder>('getOrder'))
      );
  }

  cancelOrder(id_pedido: number): Observable<DashboardOrder> {
    const url = `${this.ordersUrl}${id_pedido}/`;
    return this.apiService.delete<DashboardOrder>(url).pipe(
      catchError(this.handleError<DashboardOrder>('cancelOrder'))
    );
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
          console.error('La respuesta de pedidos no es un array:', orders);
          return [];
        }
      }),
      catchError(error => {
        console.error('Error obteniendo todos los pedidos:', error);
        return of([]);
      })
    );
  }
  
 // Método para actualizar el estado del pedido a enviado
  markOrderAsShipped(id_pedido: number, _status: string): Observable<any> { 
    const url = `${this.ordersUrl}${id_pedido}/enviar/`; 
    return this.apiService.getWithAuth(url); 
  }

  shipOrder(id_pedido: number): Observable<DashboardOrder> {
    const url = `${this.ordersUrl}${id_pedido}/enviar/`;
    return this.apiService.getWithAuth<DashboardOrder>(url).pipe(
      catchError(this.handleError<DashboardOrder>('shipOrder'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) { 
    return (error: any): Observable<T> => { 
        console.error(`${operation} failed:`, error);
        return of(result as T); 
    }; 
  }
}