import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { DashboardOrder } from '../interfaces/order';
import { UserService } from './users.service';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private baseUrl = 'http://127.0.0.1:8000';
  private ordersUrl = `${this.baseUrl}/pedidos/`;
  
  private statusFilterSubject = new BehaviorSubject<string>('TODOS');
  currentStatusFilter$ = this.statusFilterSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private userService: UserService
  ) {} 
  
  updateStatusFilter(status: string): void {
    this.statusFilterSubject.next(status);
  }
  
  getCurrentStatusFilter(): string {
    return this.statusFilterSubject.getValue();
  }

  getAllOrders(): Observable<DashboardOrder[]> {
    return this.apiService.getWithAuth<DashboardOrder[]>(this.ordersUrl).pipe(
      catchError(() => of([]))
    );
  }

  getOrder(id_pedido: number): Observable<DashboardOrder> {
    const url = `${this.ordersUrl}${id_pedido}/`;
    return this.apiService.getWithAuth<DashboardOrder>(url).pipe(
      catchError(() => of({} as DashboardOrder))
    );
  }

  cancelOrder(id_pedido: number): Observable<DashboardOrder> {
    const url = `${this.ordersUrl}${id_pedido}/`;
    return this.apiService.delete<DashboardOrder>(url).pipe(
      catchError(() => of({} as DashboardOrder))
    );
  }
  
  getUsers(): Observable<any[]> {
    return this.userService.getAllUsers();
  }
  
  getAllOrdersAdmin(): Observable<DashboardOrder[]> {
    return this.apiService.getWithAuth<DashboardOrder[]>(this.ordersUrl).pipe(
      map((orders: DashboardOrder[]) => Array.isArray(orders) ? orders : []),
      catchError(() => of([]))
    );
  }
  
  shipOrder(id_pedido: number): Observable<DashboardOrder> {
    const url = `${this.ordersUrl}${id_pedido}/enviar/`;
    return this.apiService.getWithAuth<DashboardOrder>(url).pipe(
      catchError(() => of({} as DashboardOrder))
    );
  }
}