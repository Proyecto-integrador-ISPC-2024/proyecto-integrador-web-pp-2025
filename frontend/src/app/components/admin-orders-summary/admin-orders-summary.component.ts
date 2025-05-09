import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardOrder } from '../../interfaces/order';
import { OrdersService } from '../../services/orders.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-orders-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-orders-summary.component.html',
  styleUrls: ['./admin-orders-summary.component.css']
})
export class AdminOrdersSummaryComponent implements OnInit, OnDestroy {
  @Input() orders: DashboardOrder[] = [];
  @Input() set resetSelection(value: boolean) {
    if (value) {
      this.selectedOrderId = null;
    }
  }
  
  @Output() selectedOrder = new EventEmitter<number>();
  
  selectedOrderId: number | null = null;
  private _currentStatusFilter: string = 'TODOS';
  private subscription: Subscription = new Subscription();

  constructor(private ordersService: OrdersService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.ordersService.currentStatusFilter$.subscribe(status => {
        this._currentStatusFilter = status;
        if (status === 'TODOS') {
          this.selectedOrderId = null;
        }
      })
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  get currentStatusFilter(): string {
    return this._currentStatusFilter;
  }
  
  get emptyMessage(): string {
    if (this._currentStatusFilter === 'CANCELADO') {
      return "No hay pedidos con estado Cancelado.";
    } else if (this._currentStatusFilter === 'ACEPTADO') {
      return "No hay pedidos con estado Aceptado.";
    } else if (this._currentStatusFilter === 'ENVIADO') {
      return "No hay pedidos con estado Enviado.";
    } else {
      return "No hay pedidos activos.";
    }
  }

  get nonCancelledOrders(): DashboardOrder[] {
    let filtered = this.orders;
    if (this._currentStatusFilter === 'ACEPTADO') {
      filtered = this.orders.filter(order => order.estado === 'ACEPTADO');
    } else if (this._currentStatusFilter === 'ENVIADO') {
      filtered = this.orders.filter(order => order.estado === 'ENVIADO');
    } else if (this._currentStatusFilter === 'CANCELADO') {
      filtered = [];
    } else if (this._currentStatusFilter === 'TODOS') {
      filtered = this.orders.filter(order => order.estado !== 'CANCELADO');
    }
    return filtered.sort((a, b) => {
      const getPrioridad = (estado: string): number => {
        switch (estado) {
          case 'ENVIADO': return 0;
          case 'ACEPTADO': return 1;
          default: return 2;
        }
      };
      const prioridadA = getPrioridad(a.estado);
      const prioridadB = getPrioridad(b.estado);
      
      return prioridadA - prioridadB;
    });
  }

  get totalOrders(): number {
    return this.orders.filter(order => order.estado !== 'CANCELADO').length;
  }

  get aceptadosCount(): number {
    return this.orders.filter(order => order.estado === 'ACEPTADO').length;
  }

  get enviadosCount(): number {
    return this.orders.filter(order => order.estado === 'ENVIADO').length;
  }
  
  filterByStatus(status: string): void {
    this.ordersService.updateStatusFilter(status);
  }

  selectOrder(id: number) {
    this.selectedOrderId = id;
    this.selectedOrder.emit(id);
  }
}