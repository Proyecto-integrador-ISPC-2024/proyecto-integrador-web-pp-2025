import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  standalone: true,
  selector: 'app-logout-modal',
  templateUrl: './logout-modal.component.html',
  styleUrls: ['./logout-modal.component.css'],
  imports: [CommonModule]
})
export class LogoutModalComponent {

  constructor(private authService: AuthService, private router: Router) { }

  logout() {
    console.log('Click en logout');
    
    // Cerrar el modal primero
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal) {
      const modal = bootstrap.Modal.getInstance(logoutModal);
      modal?.hide();
      
      // Remover el backdrop si es necesario
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
    
    this.authService.logout();
    console.log('Logout completado');
  }
}