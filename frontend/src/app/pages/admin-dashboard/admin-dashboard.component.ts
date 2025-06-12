import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminOrdersSummaryComponent } from '../../components/admin-orders-summary/admin-orders-summary.component';
import { AdminManagementComponent } from '../../components/admin-management/admin-management.component';
import { SalesCalculatorComponent } from '../../components/sales-calculator/sales-calculator.component';
import { OrdersService } from '../../services/orders.service';
import { DashboardOrder } from '../../interfaces/order';
import { catchError, of } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminManagementComponent, AdminOrdersSummaryComponent, SalesCalculatorComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  orders: DashboardOrder[] = [];
  filteredOrders: DashboardOrder[] = [];
  selectedOrder: DashboardOrder | null = null;
  isLoading: boolean = true;
  
  @ViewChild('adminManagement') adminManagement!: AdminManagementComponent;

  constructor(
    private ordersService: OrdersService,
    private toastService: ToastService
  ) {}
  
  ngOnInit(): void {
    this.loadOrders();
  }
  
  loadOrders(): void {
    this.isLoading = true;
    const startTime = Date.now();
    const MIN_LOADING_TIME = 500;

    this.ordersService.getAllOrders().pipe(
      catchError(() => of([])),
      tap((orders: DashboardOrder[]) => {
        if (Array.isArray(orders)) {
          this.orders = orders;
          this.filteredOrders = orders;
        }
      }),
      finalize(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);
        
        setTimeout(() => {
          this.isLoading = false;
        }, remainingTime);
      })
    ).subscribe({
      error: (error: Error) => {
        console.error('Error al cargar pedidos:', error);
        this.toastService.showError('Error al cargar los pedidos');
      }
    });
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
        this.toastService.showSuccess('Pedido cancelado exitosamente');
        this.selectedOrder = null;
        if (this.adminManagement) {
          this.adminManagement.clearSelection();
        } 
        this.loadOrders();
      }
    });
  }
  
  onMarkAsShipped(orderId: number) {
    this.ordersService.shipOrder(orderId).subscribe({
      next: () => {
        this.toastService.showSuccess('Pedido marcado como enviado exitosamente');
        this.selectedOrder = null;
        if (this.adminManagement) {
          this.adminManagement.clearSelection();
        }
        this.loadOrders();
      }
    });
  }
}
