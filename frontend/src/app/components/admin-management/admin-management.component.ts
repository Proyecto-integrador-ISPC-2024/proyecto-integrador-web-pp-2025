import { Component, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardOrder } from '../../interfaces/order';
import { OrdersService } from '../../services/orders.service';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-management.component.html',
  styleUrls: ['./admin-management.component.css']
})

export class AdminManagementComponent implements OnInit, OnDestroy {

  @Input() set orders(value: DashboardOrder[]) {
    this._orders = value;
    if (this.selectedOrderId) {
      this.highlightSelectedOrder(this.selectedOrderId);
    }
  }
  @Output() cancelOrder = new EventEmitter<number>();
  @Output() searchOrderById = new EventEmitter<number>();
  @Output() markAsShipped = new EventEmitter<number>();
  @ViewChild('searchInput') searchInputElement!: ElementRef<HTMLInputElement>;
  
  private _orders: DashboardOrder[] = [];
  private searchTerm: string = ''; 
  private errorTimeoutId: any = null;
  private tallesMap: { [key: string]: string } = {
    '3': 'M',
    '4': 'L',
    '5': 'XL',
  };
  
  usersMap: Map<number, string> = new Map<number, string>();
  currentStatusFilter: string = 'TODOS';
  previousStatusFilter: string = 'TODOS'; 
  selectedOrderId: number | null = null;
  searchError: string = ''; 
  showOrderHistory: boolean = false;
  tabs = [
    { title: 'Resumen de pedidos', isHistory: false, active: true },
    { title: 'Historial de pedidos', isHistory: true, active: false }
  ];

  constructor(private ordersService: OrdersService) { }
  
  ngOnInit(): void {
    this.loadUsers();
    this.loadCurrentUser();
    this.ordersService.currentStatusFilter$.subscribe(status => {
      this.currentStatusFilter = status;
      if (status === 'CANCELADO') {
        this.toggleOrderHistory(true);
      } 
      else if (status === 'TODOS' && this.showOrderHistory) {
        this.toggleOrderHistory(false);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.clearErrorTimeout();
  }
  
  // Métodos de carga de datos
  loadCurrentUser(): void {
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser && currentUser.id_usuario) {
          this.usersMap.set(currentUser.id_usuario, `${currentUser.nombre} ${currentUser.apellido}`);
        }
      }
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
    }
  }

  loadUsers(): void {
    this.ordersService.getUsers().subscribe({
      next: (users: any[]) => {
        users.forEach((user: any) => {
          this.usersMap.set(user.id_usuario, `${user.nombre} ${user.apellido}`);
        });
      },
      error: (error: any) => {
        console.error('Error al cargar usuarios:', error);
      }
    });
  }  

  // Getters y filtros 
  get filteredOrders(): DashboardOrder[] {
    const activeTab = this.tabs.find(tab => tab.active);
    let filtered: DashboardOrder[];
    if (activeTab && activeTab.isHistory) {
      filtered = this.orders.filter(order => order.estado === 'CANCELADO');
    } else {
      filtered = this.orders.filter(order => order.estado !== 'CANCELADO');
    }
    if (this.currentStatusFilter !== 'TODOS') {
      filtered = filtered.filter(order => order.estado === this.currentStatusFilter);
    }
    if (this.selectedOrderId) {
      const selectedOrder = this.orders.find(order => order.id_pedido === this.selectedOrderId);
      if (selectedOrder) {
        const isHistoryOrder = selectedOrder.estado === 'CANCELADO';
        if ((isHistoryOrder && !activeTab?.isHistory) || (!isHistoryOrder && activeTab?.isHistory)) {
          return [];
        }
        return [selectedOrder];
      }
    }
    // Búsqueda por nombre de cliente o producto
    if (this.searchTerm.trim() && isNaN(Number(this.searchTerm))) {
      const searchTermLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const clientName = this.getUserName(order.id_usuario).toLowerCase();
        if (clientName.includes(searchTermLower)) {
          return true;
        }
        return order.detalles.some(detalle => 
          detalle.producto.nombre_producto.toLowerCase().includes(searchTermLower)
        );
      });
    }
    const sortedOrders = filtered.sort((a, b) => {
      const getPrioridad = (estado: string): number => {
        switch (estado) {
          case 'ENVIADO': return 0;
          case 'ACEPTADO': return 1;
          case 'CANCELADO': return 2;
          default: return 3;
        }
      };  
      const prioridadA = getPrioridad(a.estado);
      const prioridadB = getPrioridad(b.estado);
      return prioridadA - prioridadB;
    });
    return sortedOrders;
  }
  
  get orders(): DashboardOrder[] {
    return this._orders;
  }
  
  // Métodos de búsqueda
  onSearch(searchTerm: string) {
    this.searchTerm = searchTerm.trim();
    this.clearErrorTimeout(); 
    this.searchError = '';
    if (!this.searchTerm) {
      return;
    }
    const orderId = Number(this.searchTerm);
    if (!isNaN(orderId)) {
      if (this.searchTerm === orderId.toString()) {
        let filteredByStatus = this.orders;
        if (this.currentStatusFilter !== 'TODOS') {
          filteredByStatus = this.orders.filter(order => order.estado === this.currentStatusFilter);
        }
        const foundOrder = filteredByStatus.find(order => order.id_pedido === orderId);
        const existsInAll = this.orders.find(order => order.id_pedido === orderId);
        if (foundOrder) {
          this.previousStatusFilter = this.currentStatusFilter;
          this.searchOrderById.emit(orderId);
          this.selectedOrderId = orderId;
          if (foundOrder.estado === 'CANCELADO') {
            this.toggleOrderHistory(true);
          } else {
            this.toggleOrderHistory(false);
          }
        } else if (existsInAll && this.currentStatusFilter !== 'TODOS') {
          this.setErrorWithTimeout(`El pedido #${orderId} existe pero no tiene el estado ${this.currentStatusFilter}`);
        } else {
          this.setErrorWithTimeout(`El pedido #${orderId} no existe`);
        }
      }
    } else {
      const searchTermLower = this.searchTerm.toLowerCase();
      
      let filteredByStatus = this.orders;
      if (this.currentStatusFilter !== 'TODOS') {
        filteredByStatus = this.orders.filter(order => order.estado === this.currentStatusFilter);
      }
      
      const hasResults = filteredByStatus.some(order => {
        const clientName = this.getUserName(order.id_usuario).toLowerCase();
        if (clientName.includes(searchTermLower)) {
          return true;
        }
        
        return order.detalles.some(detalle => 
          detalle.producto.nombre_producto.toLowerCase().includes(searchTermLower)
        );
      });
      if (!hasResults) {
        this.setErrorWithTimeout(`No se encontraron resultados para "${this.searchTerm}"`);
      }
      this._orders = [...this._orders];
    }
  }
  
  clearSearch(searchInput: HTMLInputElement) {
    searchInput.value = '';
    this.searchTerm = '';
    this.clearErrorTimeout();
    this.searchError = '';
    this.onSearch('');
  }
  
  // Métodos de filtrado y gestión de pedidos 
  filterByStatus(status: string) {
    this.previousStatusFilter = this.currentStatusFilter;
    this.ordersService.updateStatusFilter(status);
    if (status === 'CANCELADO') {
      this.toggleOrderHistory(true);
    } 
    else if (status === 'ACEPTADO' || status === 'ENVIADO') {
      this.toggleOrderHistory(false);
    }
    else if (status === 'TODOS' && this.showOrderHistory) {
      this.toggleOrderHistory(false);
    }
  }
  
  onCancelOrder(id_pedido: number) {
    this.cancelOrder.emit(id_pedido);
  }

  toggleOrderHistory(isHistory: boolean) {
    this.showOrderHistory = isHistory;
    this.tabs = this.tabs.map(tab => ({
      ...tab,
      active: tab.isHistory === isHistory
    })).sort((a, b) => b.active ? 1 : -1);
  }
  
  highlightSelectedOrder(orderId: number | null) {
    this.selectedOrderId = orderId;
    this._orders = [...this._orders];
    if (orderId === null) {
      this.searchOrderById.emit(0);
      this.searchTerm = '';
      this.ordersService.updateStatusFilter(this.previousStatusFilter);
      if (this.searchInputElement) {
        this.searchInputElement.nativeElement.value = '';
      }
    }
  }

  handleOrderSelection(orderId: number) {
    this.previousStatusFilter = this.currentStatusFilter;
    this.highlightSelectedOrder(orderId);
    this.searchTerm = '';
    const selectedOrder = this.orders.find(order => order.id_pedido === orderId);
    if (selectedOrder) {
      if (selectedOrder.estado === 'ACEPTADO' || selectedOrder.estado === 'ENVIADO') {
        this.toggleOrderHistory(false);
        setTimeout(() => {
          const dashboardElement = document.querySelector('.card.shadow-sm.h-100');
          if (dashboardElement) {
            dashboardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else if (selectedOrder.estado === 'CANCELADO') {
        this.toggleOrderHistory(true);
      }
    }
  }
  
  //  Métodos de utilidad 
  formatFormasDePago(forma_de_pago: { forma_de_pago_descripcion: string }[]): string {
    if (!forma_de_pago) return '';
    return forma_de_pago.map(fp => fp.forma_de_pago_descripcion).join(', ');
  }
  
  getUserName(userId: number): string {
    return this.usersMap.get(userId) || `Usuario ID: ${userId}`;
  }
  
  orderExists(id: number | null): boolean {
    return !!this.orders.find(order => order.id_pedido === id);
  }
  
  // Métodos privados 
  private setErrorWithTimeout(errorMessage: string, timeout: number = 5000) {
    this.searchError = errorMessage;
    this.clearErrorTimeout(); 
    this.errorTimeoutId = setTimeout(() => {
      this.searchError = '';
    }, timeout);
  }
  
  private clearErrorTimeout() {
    if (this.errorTimeoutId) {
      clearTimeout(this.errorTimeoutId);
      this.errorTimeoutId = null;
    }
  }

  getTalleFormatted(id_talle: any): string {
    if (typeof id_talle === 'object' && id_talle !== null && id_talle.id) {
      return this.tallesMap[id_talle.id] || id_talle.id;
    }
    return this.tallesMap[id_talle] || id_talle;
  }
  
  clearSelection(): void {
    this.selectedOrderId = null;
  }

  onShipOrder(id_pedido: number) {
    console.log('Shipping order:', id_pedido);
    this.markAsShipped.emit(id_pedido);
  }
}
