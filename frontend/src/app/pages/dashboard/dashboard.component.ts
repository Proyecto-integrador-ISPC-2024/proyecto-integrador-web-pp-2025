import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  userRole: string = '';

  ngOnInit(): void {
    this.getUserRole();
  }

  getUserRole(): void {
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        this.userRole = currentUser.rol || '';
      }
    } catch (error) {
      console.error('Error al obtener el rol del usuario:', error);
      this.userRole = '';
    }
  }

  isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  isClient(): boolean {
    return this.userRole === 'CLIENTE';
  }
}
