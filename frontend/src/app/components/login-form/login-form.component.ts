import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
})
export class LoginFormComponent {
  email: string = '';
  password: string = '';
  passwordVisible: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService
      .login({ email: this.email, password: this.password })
      .subscribe({
        next: (response) => {
          if (response && response.token) {
            // Cerrar el modal
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
              const modal = bootstrap.Modal.getInstance(loginModal);
              modal?.hide();
            }
            
            alert('Autenticación exitosa');
            this.router.navigateByUrl('/');
            
            // Limpiar formulario
            this.email = '';
            this.password = '';
          } else {
            alert('Error de autenticación: Respuesta del servidor incompleta');
          }
        },
        error: (err) => {
          console.error('Error de autenticación:', err);
          alert(
            'Error de autenticación: ' +
              (err.error.message || 'Ocurrió un error')
          );
        },
      });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
    const passwordInput = document.getElementById(
      'inputPassword'
    ) as HTMLInputElement;
    if (passwordInput) {
      passwordInput.type = this.passwordVisible ? 'text' : 'password';
    }
  }
}