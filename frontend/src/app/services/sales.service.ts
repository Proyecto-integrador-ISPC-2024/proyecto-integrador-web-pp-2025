import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AdminService } from './admin.service';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private url = 'http://127.0.0.1:8000/pedidos/calcular_ventas';

  constructor(
    private apiService: ApiService,
    private adminService: AdminService
  ) { }

  calcularVentas(fechaInicio: string, fechaFin: string): Observable<any> {
    if (!this.adminService.isAdmin() && !this.adminService.isSuperAdmin()) {
      return throwError(() => new Error('Solo los administradores pueden acceder a esta funcionalidad'));
    }

    const params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin)
      .set('estado', 'enviado');

    const urlWithParams = `${this.url}/?${params.toString()}`;
    
    return this.apiService.getWithAuth<any>(urlWithParams);
  }
} 