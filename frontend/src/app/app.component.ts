import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map, mergeMap } from 'rxjs/operators';

import { DarkThemeService } from './services/dark-theme.service';

import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { CartComponent } from './pages/cart/cart.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LandingComponent } from './pages/landing/landing.component';
import { ProductsComponent } from './pages/products/products.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, LandingComponent, CartComponent, DashboardComponent, HeaderComponent, ProductsComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Tienda de campeones';

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private titleService = inject(Title);

  constructor(private darkThemeService: DarkThemeService) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap(route => route.data)
      )
      .subscribe(data => {
        const dynamicTitle = data['title'];
        if (dynamicTitle) {
          this.titleService.setTitle(dynamicTitle);
        }
      });
  }
  // Al inicializar el componente, aplica el tema guardado
  ngOnInit(): void {
    this.darkThemeService.applyTheme(); // Aplica el tema al body
  }

  // Método para alternar entre los temas
  toggleTheme(): void {
    const currentTheme = this.darkThemeService.getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.darkThemeService.setTheme(newTheme); // Guarda el nuevo tema
    this.darkThemeService.applyTheme(); // Aplica el tema actualizado
  }
}
