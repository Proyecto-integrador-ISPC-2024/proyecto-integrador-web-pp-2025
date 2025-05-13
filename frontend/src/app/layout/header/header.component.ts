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

import { DarkThemeService } from '../../services/dark-theme.service';

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
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  showHomeLink = true;
  showAboutLink = true;
  showProductsLink = true;
  isAuthenticated = false;
  modalFormVisible = false;
  iconName: string = 'dark_mode';

  private authSubscription?: Subscription;

  constructor(
    private router: Router,
    private modalService: ModalService,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    public darkThemeService: DarkThemeService
  ) {}

  ngOnInit(): void {
     // Establece ícono inicial según el tema actual
    this.iconName = this.darkThemeService.getTheme() === 'dark' ? 'light_mode' : 'dark_mode';

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

  modalRegisterForm(): void {
    this.modalService.showRegisterModal();
  }

  updateNavbarLinks(currentUrl: string): void {
    this.showHomeLink = true;
    this.showAboutLink = true;
    this.showProductsLink = true;
  }


  toggleTheme(): void {
    const currentTheme = this.darkThemeService.getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    this.darkThemeService.setTheme(newTheme);
    this.darkThemeService.applyTheme();

     this.iconName = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
}
  }

