import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';


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

  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService) {}

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

            this.toastr.success('Autenticación exitosa', 'Bienvenido');
            this.router.navigateByUrl('/');

            // Limpiar formulario
            this.email = '';
            this.password = '';
          } else {
            this.toastr.warning('Respuesta del servidor incompleta', 'Error de autenticación');
          }
        },
        error: (err) => {
          console.error('Error de autenticación:', err);
          this.toastr.error(err.error.message || 'Ocurrió un error','Error de autenticación');
        },
      });
  }

togglePasswordVisibility(): void {
  this.passwordVisible = !this.passwordVisible;
}
}
