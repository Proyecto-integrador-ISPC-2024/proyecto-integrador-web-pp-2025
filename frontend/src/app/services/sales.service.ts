import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AdminService } from './admin.service';
import { SalesResponse } from '../interfaces/sales';

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private baseUrl = 'http://127.0.0.1:8000';
  private salesUrl = `${this.baseUrl}/pedidos/calcular_ventas`;

  constructor(
    private apiService: ApiService,
    private adminService: AdminService
  ) { }

  calcularVentas(fechaInicio: string, fechaFin: string): Observable<SalesResponse> {
    if (!this.adminService.isAdmin() && !this.adminService.isSuperAdmin()) {
      return throwError(() => new Error('Solo los administradores pueden acceder a esta funcionalidad'));
    }

    const params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin)
      .set('estado', 'enviado');

    const urlWithParams = `${this.salesUrl}/?${params.toString()}`;
    
    return this.apiService.getWithAuth<SalesResponse>(urlWithParams).pipe(
      catchError(error => {
        console.error('Error al calcular ventas:', error);
        return of({
          total_ventas: 0,
          cantidad_pedidos: 0,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        });
      })
    );
  }
} 