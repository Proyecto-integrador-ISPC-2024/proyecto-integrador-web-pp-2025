import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeButtonComponent } from '../../components/theme-button/theme-button.component';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RegisterFormComponent } from '../../components/register-form/register-form.component';
import { ModalService } from '../../services/modalstatus.service';
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { LogoutModalComponent } from '../../components/logout-modal/logout-modal.component';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    ThemeButtonComponent,
    RegisterFormComponent,
    RouterLink,
    CommonModule,
    RouterLinkActive,
    LoginFormComponent,
    LogoutModalComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  showHomeLink = true;
  showAboutLink = true;
  showProductsLink = true;
  isAuthenticated = false;
  modalFormVisible = false;

  private authSubscription?: Subscription;

  constructor(
    private router: Router,
    private modalService: ModalService,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Verificar estado inicial
    this.isAuthenticated = this.authService.isAuthenticated();
    console.log('Estado inicial de autenticación:', this.isAuthenticated);

    // Suscribirse a cambios de autenticación
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuth => {
      console.log('Cambio de estado de autenticación:', isAuth);
      this.isAuthenticated = isAuth;
      this.changeDetectorRef.detectChanges(); // Forzar detección de cambios
    });

    // Manejo de navegación
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const currentUrl = event.urlAfterRedirects;
        this.updateNavbarLinks(currentUrl);
      }
    });

    // Modal de registro
    this.modalService.registerModalVisible$.subscribe(visible => {
      this.modalFormVisible = visible;
    });
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  modalRegisterForm() {
    this.modalService.showRegisterModal();
  }

  updateNavbarLinks(currentUrl: string): void {
    this.showHomeLink = !currentUrl.includes('/') || currentUrl === '/';
    this.showAboutLink = !currentUrl.includes('/about');
    this.showProductsLink = !currentUrl.includes('/products');
  }

  toggleTheme(event: Event):void{
    const body = document.body;
    const isDark = body.classList.contains('dark-theme');

    if (isDark){
      body.classList.remove('dark-theme');
      localStorage.setItem('theme','light');
    }else{
      body.classList.add('dark-theme');
      localStorage.setItem('theme','dark');
    }
  }
}
