import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-sales-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-calculator.component.html',
  styleUrls: ['./sales-calculator.component.css']
})
export class SalesCalculatorComponent {
  fechaInicio: string = '';
  fechaFin: string = '';
  totalVentas: number | null = null;
  error: string | null = null;
  loading: boolean = false;

  constructor(
    private salesService: SalesService,
    private adminService: AdminService
  ) {}

  calcularVentas() {
    if (!this.fechaInicio || !this.fechaFin) {
      this.error = 'Por favor, seleccione ambas fechas';
      return;
    }

    if (!this.adminService.isAdmin() && !this.adminService.isSuperAdmin()) {
      this.error = 'No tiene permisos para acceder a esta funcionalidad';
      return;
    }

    this.loading = true;
    this.error = null;
    this.totalVentas = null;

    this.salesService.calcularVentas(this.fechaInicio, this.fechaFin).subscribe({
      next: (response) => {
        this.totalVentas = response.total_ventas;
        this.loading = false;
      },
    });
  }
} 