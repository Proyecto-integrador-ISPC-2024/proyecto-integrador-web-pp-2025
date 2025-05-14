import { Routes } from '@angular/router';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CartComponent } from './pages/cart/cart.component';
import { LandingComponent } from './pages/landing/landing.component';
import { ProductsComponent } from './pages/products/products.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ClientDashboardComponent } from './pages/client-dashboard/client-dashboard.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminListUsersComponent } from './components/admin-list-users/admin-list-users.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { RegisterFormComponent } from './components/register-form/register-form.component';
import { authGuard } from './guards/auth.guard';
import { HttpClientModule } from '@angular/common/http';
import { LogoutModalComponent } from './components/logout-modal/logout-modal.component';
import { ClientDatosComponent } from './pages/client-datos/client-datos.component';
import { TerminosCondicionesComponent } from './pages/terminos-condiciones/terminos-condiciones.component';

export const routes: Routes = [
  { path: '', component: LandingComponent, data: { title: 'Inicio | Tienda de campeones' } },

  { path: 'about', component: AboutUsComponent, data: { title: 'Nosotros | Tienda de campeones' } },

  { path: 'dashboard', component: DashboardComponent, data: { title: 'Dashboard | Tienda de campeones' } },

  { path: 'cart', component: CartComponent, canActivate: [authGuard], data: { title: 'Carrito | Tienda de campeones' } },

  { path: 'products', component: ProductsComponent, data: { title: 'Productos | Tienda de campeones' } },

  { path: 'contact', component: ContactComponent, data: { title: 'Contacto | Tienda de campeones' } },

  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [authGuard], data: { title: 'Admin | Tienda de campeones' } },
  
  { path: 'admin-list-users', component: AdminListUsersComponent, canActivate: [authGuard], data: { title: 'Lista de usuarios | Tienda de campeones' } },

  { path: 'client-dashboard', component: ClientDashboardComponent, canActivate: [authGuard], data: { title: 'Mi cuenta | Tienda de campeones' } },

<<<<<<< HEAD
  { path: 'client-datos', component: ClientDatosComponent,canActivate: [authGuard], data: { title: 'Mis datos | Tienda de campeones' } },
=======
  { path: 'client-datos', component: ClientDatosComponent, canActivate: [authGuard], data: { title: 'Mis datos | Tienda de campeones' } },
>>>>>>> 5ad0db7b0ff8a24a390f5dd6bef9b2c55489f5b4

  { path: 'terminos-condiciones', component: TerminosCondicionesComponent, data: { title: 'Términos y condiciones | Tienda de campeones' } },

  { path: '**', component: NotFoundComponent, data: { title: 'Página no encontrada | Tienda de campeones' } },

  { path: 'login-form', component: LoginFormComponent, data: { title: 'Iniciar sesión | Tienda de campeones' } },

  { path: 'logout', component: LogoutModalComponent, data: { title: 'Cerrar sesión | Tienda de campeones' } },

  { path: 'registro', component: RegisterFormComponent, data: { title: 'Registrarme | Tienda de campeones' } },

];

