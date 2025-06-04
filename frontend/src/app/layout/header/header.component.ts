import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

/*  módulos y componentes existentes  */
import { ThemeButtonComponent } from '../../components/theme-button/theme-button.component';
import { RegisterFormComponent } from '../../components/register-form/register-form.component';
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { LogoutModalComponent } from '../../components/logout-modal/logout-modal.component';
import { ModalService } from '../../services/modalstatus.service';
import { AuthService } from '../../services/auth.service';
import { DarkThemeService } from '../../services/dark-theme.service';

/*  nuevo servicio  */
import { CartService } from '../../services/cart.service';

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

  /* links / autenticación */
  showHomeLink = true;
  showAboutLink = true;
  showProductsLink = true;
  isAuthenticated = false;

  /* dark-mode button */
  iconName = 'dark_mode';

  /* modal de registro */
  modalFormVisible = false;

  /* contador del carrito */
  cartQty = 0;

  /* suscripciones */
  private authSub?: Subscription;
  private cartSub?: Subscription;

  constructor(
    private router: Router,
    private modalService: ModalService,
    private authService: AuthService,
    private changeDetector: ChangeDetectorRef,
    public darkThemeService: DarkThemeService,
    private cartService: CartService               // <-- inyectamos CartService
  ) {}

  ngOnInit(): void {
    /* icono de tema */
    this.iconName = this.darkThemeService.getTheme() === 'dark' ? 'light_mode' : 'dark_mode';

    /* estado inicial de auth + listener */
    this.isAuthenticated = this.authService.isAuthenticated();
    this.authSub = this.authService.isAuthenticated$.subscribe(v => {
      this.isAuthenticated = v;
      this.changeDetector.detectChanges();
    });

    /* contador del carrito */
    this.cartSub = this.cartService.cartQuantity$.subscribe(qty => {
      this.cartQty = qty;
      this.changeDetector.markForCheck();
    });

    /* navegación */
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) this.updateNavbarLinks(e.urlAfterRedirects);
    });

    /* modal register */
    this.modalService.registerModalVisible$.subscribe(v => this.modalFormVisible = v);
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.cartSub?.unsubscribe();
  }

  /* acciones UI */
  modalRegisterForm(): void { this.modalService.showRegisterModal(); }

  updateNavbarLinks(_: string): void {
    this.showHomeLink = this.showAboutLink = this.showProductsLink = true;
  }

  toggleTheme(): void {
    const newTheme = this.darkThemeService.getTheme() === 'dark' ? 'light' : 'dark';
    this.darkThemeService.setTheme(newTheme);
    this.darkThemeService.applyTheme();
    this.iconName = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
  }
}
