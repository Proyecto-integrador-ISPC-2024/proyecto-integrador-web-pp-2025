import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map, mergeMap } from 'rxjs/operators';

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
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Tienda de campeones';

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private titleService = inject(Title);

  constructor() {
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
}