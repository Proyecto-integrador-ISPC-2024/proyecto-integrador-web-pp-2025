import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminOrdersSummaryComponent } from '../../components/admin-orders-summary/admin-orders-summary.component';
import { AdminManagementComponent } from '../../components/admin-management/admin-management.component';
import { OrdersService } from '../../services/orders.service';
import { DashboardOrder } from '../../interfaces/order';
import { catchError, of, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminManagementComponent, AdminOrdersSummaryComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  orders: DashboardOrder[] = [];
  filteredOrders: DashboardOrder[] = [];
  selectedOrder: DashboardOrder | null = null;
  toastService: any; 
  
  @ViewChild('adminManagement') adminManagement!: AdminManagementComponent;

  constructor(private ordersService: OrdersService) {}
  
  ngOnInit() {
    this.loadOrders().subscribe({
      error: (error) => console.error('Error cargando pedidos:', error)
    });
  }
  
  loadOrders(): Observable<DashboardOrder[]> {
    return this.ordersService.getAllOrdersAdmin().pipe(
      catchError(error => {
        console.error('Error cargando pedidos:', error);
        return of([]);
      }),
      tap((orders: DashboardOrder[]) => {
        if (Array.isArray(orders)) {
          this.orders = orders;
          this.filteredOrders = orders;
        } else {
          console.error('La respuesta de pedidos no es un array:', orders);
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
            if (order) {
              this.filteredOrders = [order];
            }
          },
          error: (error) => {
            console.error(`Error buscando pedido por ID ${id}:`, error);
          }
        });
      }
    } else {
      this.filteredOrders = [...this.orders];
      this.selectedOrder = null;
    }
  }
  
  selectOrder(id: number) {
    const order = this.orders.find(order => order.id_pedido === id);
    if (order) {
      this.selectedOrder = order;
      this.filteredOrders = [order];
      
      setTimeout(() => {
        if (this.adminManagement) {
          this.adminManagement.handleOrderSelection(id);
        }
      }, 100);
    }
  }
  
  onCancelOrder(id_pedido: number): void {
    this.ordersService.cancelOrder(id_pedido).subscribe({
      next: () => {
        this.selectedOrder = null;
        if (this.adminManagement) {
          this.adminManagement.clearSelection();
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
  
  onMarkAsShipped(orderId: number) {
    this.ordersService.markOrderAsShipped(orderId, 'ENVIADO').subscribe({
      next: () => {
        this.selectedOrder = null;
        if (this.adminManagement) {
          this.adminManagement.clearSelection();
        }
        this.loadOrders().subscribe({
          next: () => {
            this.filteredOrders = [...this.orders];
          },
          error: (error) => console.error('Error cargando pedidos:', error)
        });
      },
      error: (error) => {
        console.error('Error al marcar pedido como enviado:', error);
      }
    });
  }
  
  onShipOrder(id_pedido: number): void {
    this.ordersService.shipOrder(id_pedido).subscribe({
      next: () => {
        this.loadOrders().subscribe({
          error: (error: any) => console.error('Error cargando pedidos:', error)
        });
      },
      error: (error: any) => console.error('Error enviando pedido:', error)
    });
  }
}
