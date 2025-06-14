import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersSummaryComponent } from '../../components/orders-summary/orders-summary.component';
import { ProductsSuggestComponent } from '../../components/products-suggest/products-suggest.component';
import { OrderManagementComponent } from '../../components/order-management/order-management.component';
import { OrdersService } from '../../services/orders.service';
import { DashboardOrder } from '../../interfaces/order';
import { catchError, of, finalize } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/users.service';

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
  id_usuario: number = 0;
  isLoading: boolean = true;
  
  @ViewChild('orderManagement') orderManagement!: OrderManagementComponent;

  constructor(
    private ordersService: OrdersService, private toastService: ToastService, private authService: AuthService, private userService: UserService) {}

  ngOnInit(): void {
    this.initializeUserData();
    this.loadOrders();
  }

  private initializeUserData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.nombre || !currentUser.apellido) {
      this.userService.getUserData().subscribe({
        next: (userData: any) => {
          this.id_usuario = userData.id_usuario;
          this.authService.updateCurrentUser(userData);
        },
        error: (error: any) => {
          console.error('Error al obtener datos del usuario:', error);
          this.toastService.showError('Error al cargar los datos del usuario');
        }
      });
    } else {
      this.id_usuario = currentUser.id_usuario;
    }
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
          this.filteredOrders = orders.filter(order => order.id_usuario === this.id_usuario);
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
            if (order && order.id_usuario === this.id_usuario) {
              this.filteredOrders = [order];
            }
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
        this.toastService.showSuccess('Pedido cancelado exitosamente');
        this.selectedOrder = null;
        if (this.orderManagement) {
          this.orderManagement.clearSelection();
        } 
        this.loadOrders();
      }
    });
  }
}