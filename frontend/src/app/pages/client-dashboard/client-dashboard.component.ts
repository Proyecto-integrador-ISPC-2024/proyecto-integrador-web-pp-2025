import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersSummaryComponent } from '../../components/orders-summary/orders-summary.component';
import { ProductsSuggestComponent } from '../../components/products-suggest/products-suggest.component';
import { OrderManagementComponent } from '../../components/order-management/order-management.component';
import { OrdersService } from '../../services/orders.service';
import { DashboardOrder } from '../../interfaces/order';
import { catchError, of, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, OrderManagementComponent, OrdersSummaryComponent, ProductsSuggestComponent],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css']
})

export class ClientDashboardComponent implements OnInit {
  orders: DashboardOrder[] = [];
  filteredOrders: DashboardOrder[] = [];
  selectedOrder: DashboardOrder | null = null;
  id_usuario: number;
  
  @ViewChild('orderManagement') orderManagement!: OrderManagementComponent;

  constructor(private ordersService: OrdersService) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.id_usuario) {
      this.id_usuario = currentUser.id_usuario;
    } else {
      this.id_usuario = NaN;
    }
  }
  
  ngOnInit() {
    this.loadOrders().subscribe({
      error: (error) => console.error('Error loading orders:', error)
    });
  }
  
  loadOrders(): Observable<DashboardOrder[]> {
    return this.ordersService.getAllOrders().pipe(
      catchError(error => {
        console.error('Error loading orders:', error);
        return of([]);
      }),
      tap((orders: DashboardOrder[]) => {
        if (Array.isArray(orders)) {
          this.orders = orders;
          this.filteredOrders = orders.filter(order => order.id_usuario === this.id_usuario);
        } else {
          console.error('Orders response is not an array:', orders);
        }
      })
    );
  }
  
  searchOrderById(id: number) {
    if (id) {
      const order = this.orders.find(order => order.id_pedido === id);
      if (order) {
        this.filteredOrders = [order];
      } else {
        this.ordersService.getOrder(id).subscribe({
          next: (order) => {
            if (order && order.id_usuario === this.id_usuario) {
              this.filteredOrders = [order];
            }
          },
          error: (error) => {
            console.error(`Error searching order by ID ${id}:`, error);
          }
        });
      }
    } else {
      this.filteredOrders = [...this.orders.filter(order => order.id_usuario === this.id_usuario)];
      this.selectedOrder = null;
    }
  }
  
  selectOrder(id: number) {
    const order = this.orders.find(order => order.id_pedido === id);
    if (order) {
      this.selectedOrder = order;
      this.filteredOrders = [order];
      
      setTimeout(() => {
        if (this.orderManagement) {
          this.orderManagement.handleOrderSelection(id);
        }
      }, 100);
    }
  }
  
  clearOrderSelection() {
    this.selectedOrder = null;
    this.filteredOrders = this.orders.filter(order => order.id_usuario === this.id_usuario);
    
    this.ordersService.updateStatusFilter('TODOS');
    
    if (this.orderManagement) {
      this.orderManagement.highlightSelectedOrder(null);
    }
  }
  
  toggleOrderHistory(isHistory: boolean) {
    this.filteredOrders = isHistory
      ? this.orders
      : this.orders.filter(order => order.estado !== 'CANCELADO');
  }
  
  onCancelOrder(id_pedido: number): void {
    this.ordersService.cancelOrder(id_pedido).subscribe({
      next: () => {
        this.selectedOrder = null;
        if (this.orderManagement) {
          this.orderManagement.clearSelection();
        } 
        this.loadOrders().subscribe({
          next: () => {
            this.filteredOrders = [...this.orders];
          },
          error: (error) => console.error('Error cargando pedidos:', error)
        });
      },
      error: (error) => console.error('Error cancelando pedido:', error)
    });
  }
}