import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../services/users.service';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-list-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-list-users.component.html',
  styleUrl: './admin-list-users.component.css'
})
export class AdminListUsersComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  allUsers: any[] = [];
  activeFilter: string = 'TODOS';
  searchTerm: string = '';
  activeStatusFilter: string = 'TODOS';
  userForm: FormGroup;
  isLoading = false;
  showCreateForm = false;
  isCurrentUserAdmin = false;
  isCurrentUserSuperAdmin = false;
  currentUserRole = '';
  userPermissions: any = {};
  hasAdminAccess = false;
  accessDenied = false;
  isAdmin = false;

  constructor(
    private userService: UserService,
    private adminService: AdminService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
    
    this.userForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(passwordRegex)]],
      domicilio: ['', Validators.required],
      rol: ['CLIENTE', Validators.required]
    });
  }
  
  ngOnInit(): void {
    this.loadUsers();
  }

  private initializeUserPermissions(): void {
    const currentUser = this.userService.getCurrentUser();
    
    this.userPermissions = {
      id: currentUser.id_usuario,
      rol: currentUser.rol || 'DESCONOCIDO',
      is_staff: currentUser.is_staff === true || currentUser.is_staff === 1 || currentUser.is_staff === '1' ? 1 : 0
    };
    
    this.isCurrentUserAdmin = this.adminService.isAdmin();
    this.isCurrentUserSuperAdmin = this.adminService.isSuperAdmin();
    this.currentUserRole = currentUser.rol || '';
  }

  loadUsers(): void {
    this.isLoading = true;
    this.initializeUserPermissions();
    
    this.adminService.getAllUsers()
      .pipe(
        catchError(error => {
          this.isLoading = false;
          this.toastService.showError('Error al cargar la lista de usuarios');
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          this.isLoading = false;
          
          if (data && data.length > 0) {
            this.allUsers = this.sortUsersByRole(data);
            this.applyFilters();
          } else {
            this.toastService.showInfo('No hay usuarios registrados en el sistema');
          }
        }
      });
  }

  createUser(): void {
    if (this.userForm.valid) {
      this.isLoading = true;      
      const rolSeleccionado = this.userForm.value.rol;    
      
      if (rolSeleccionado === 'ADMIN') {
        if (!this.isCurrentUserAdmin && !this.isCurrentUserSuperAdmin) {
          this.isLoading = false;
          return;
        }
      }
      
      const userData: any = {
        nombre: this.userForm.value.nombre,
        apellido: this.userForm.value.apellido,
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        domicilio: this.userForm.value.domicilio || '',
        rol: rolSeleccionado,
        is_active: true
      };     
      
      if (rolSeleccionado === 'ADMIN') {
        userData.is_staff = true;
        userData.is_superuser = false; 
      }     
      
      const service = rolSeleccionado === 'ADMIN' ? this.adminService : this.userService;
      service.createUser(userData)
        .pipe(
          catchError(error => {
            if (error.status === 403) {
              this.toastService.showError('No tienes permisos para crear usuarios');
            } else {
              this.toastService.showError('El email ya está registrado en el sistema');
            }
            this.isLoading = false;
            return of(null);  
          })
        )
        .subscribe({
          next: (response) => {
            if (response) {
              this.toastService.showSuccess(`Usuario ${rolSeleccionado.toLowerCase()} creado exitosamente`);
              this.userForm.reset();
              this.userForm.patchValue({ rol: 'CLIENTE' });
              this.showCreateForm = false;
              
              this.loadUsers();
            }
            this.isLoading = false;
          }
        });
    } else {
      this.toastService.showError('Por favor, complete todos los campos requeridos');
    }
  }

  deactivateUser(user: any): void {
    if (!user || !user.id_usuario) {
      this.toastService.showError("No se puede desactivar: ID de usuario no válido");
      return;
    }
    
    if (!this.canDeactivateUser(user)) {
      this.toastService.showError("No tienes permiso para desactivar este usuario");
      return;
    }
    
    if (confirm(`¿Está seguro que desea desactivar al usuario "${user.nombre} ${user.apellido}"?`)) {
      this.isLoading = true;
      
      this.adminService.deactivateUserById(user.id_usuario)
        .pipe(
          catchError(error => {
            if (error.status === 403) {
              this.toastService.showError('No tienes permisos para desactivar este usuario');
            } else {
              this.toastService.showError('Error al desactivar usuario');
            }
            this.isLoading = false;
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            if (response !== null) {
              this.toastService.showSuccess('Usuario desactivado exitosamente');
              this.loadUsers();
            }
            this.isLoading = false;
          }
        });
    }
  }

  // Método para aplicar filtro
  applyFilter(filterValue: string): void {
    this.activeFilter = filterValue;
    this.applyFilters();
  }

  // Método para aplicar búsqueda
  applySearch(searchValue: string): void {
    this.searchTerm = searchValue.toLowerCase().trim();
    this.applyFilters();
  }

  // Método para aplicar filtro de estado
  applyStatusFilter(statusValue: string): void {
    this.activeStatusFilter = statusValue;
    this.applyFilters();
  }

  applyFilters(): void {
    if (this.activeFilter === 'TODOS') {
      this.filteredUsers = [...this.allUsers];
    } else {
      this.filteredUsers = this.allUsers.filter(user => user.rol === this.activeFilter);
    }
    
    // Aplicar filtro de estado activo/inactivo
    if (this.activeStatusFilter !== 'TODOS') {
      const isActive = this.activeStatusFilter === 'ACTIVO';
      this.filteredUsers = this.filteredUsers.filter(user => user.is_active === isActive);
    }
    
    if (this.searchTerm) {
      this.filteredUsers = this.filteredUsers.filter(user => 
        user.nombre.toLowerCase().includes(this.searchTerm) || 
        user.apellido.toLowerCase().includes(this.searchTerm) ||
        `${user.nombre.toLowerCase()} ${user.apellido.toLowerCase()}`.includes(this.searchTerm)
      );
    }
    
    this.users = this.filteredUsers;
  }

  // Método para limpiar filtros
  clearFilters(): void {
    this.activeFilter = 'TODOS';
    this.activeStatusFilter = 'TODOS';
    this.searchTerm = '';
    this.applyFilters();
  }

  // Método para ordenar usuarios por rol
  sortUsersByRole(users: any[]): any[] {
    return [...users].sort((a, b) => {
      const aSuper = typeof a.is_superuser === 'boolean' ? (a.is_superuser ? 1 : 0) : Number(a.is_superuser);
      const bSuper = typeof b.is_superuser === 'boolean' ? (b.is_superuser ? 1 : 0) : Number(b.is_superuser);
      
      const aStaff = typeof a.is_staff === 'boolean' ? (a.is_staff ? 1 : 0) : Number(a.is_staff);
      const bStaff = typeof b.is_staff === 'boolean' ? (b.is_staff ? 1 : 0) : Number(b.is_staff);

      const getPriority = (user: any): number => {
        const isSuperuser = typeof user.is_superuser === 'boolean' ? user.is_superuser : Number(user.is_superuser) === 1;
        const isStaff = typeof user.is_staff === 'boolean' ? user.is_staff : Number(user.is_staff) === 1;
        
        if (isSuperuser && isStaff) {
          return 1; 
        } else if (user.rol === 'ADMIN') {
          return 2; 
        } else {
          return 3; 
        }
      };
      
      const aPriority = getPriority(a);
      const bPriority = getPriority(b);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      if (aPriority === 1) {
        return Number(a.id_usuario) - Number(b.id_usuario);
      }
      
      if (aPriority === 2) {
        return Number(a.id_usuario) - Number(b.id_usuario);
      }
      
      if (a.nombre !== b.nombre) {
        return a.nombre.localeCompare(b.nombre);
      }
      
      return a.apellido.localeCompare(b.apellido);
    });
  }

  // Método para alternar la visibilidad del formulario de creación de usuario
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.userForm.reset();
      this.userForm.patchValue({ rol: 'CLIENTE' });
    }
  }

  // Método para verificar si se puede crear un administrador
  canCreateAdmin(): boolean {
    return this.isCurrentUserAdmin || this.isCurrentUserSuperAdmin;
  }

  // Método para verificar si se puede desactivar un usuario
  canDeactivateUser(user: any): boolean {
    if (!user || (!this.isCurrentUserAdmin && !this.isCurrentUserSuperAdmin)) {
      return false;
    }

    // Un usuario no puede desactivarse a sí mismo
    if (user.id_usuario === this.userPermissions.id) {
      return false;
    }

    // Un admin no puede desactivar a un superadmin
    if (user.is_superuser && !this.isCurrentUserSuperAdmin) {
      return false;
    }

    // Un superadmin no puede desactivar a otro superadmin
    if (user.is_superuser && this.isCurrentUserSuperAdmin) {
      return false;
    }

    // Un admin no puede desactivar a otro admin
    if (user.rol === 'ADMIN' && !this.isCurrentUserSuperAdmin) {
      return false;
    }

    return true;
  }

  // Método de mensaje de falta de permisos
  shouldShowNoPermission(user: any): boolean {
    if (!user.is_active || Number(user.id_usuario) === Number(this.userPermissions.id)) {
      return false;
    }
    
    if (user.is_superuser && !this.isCurrentUserSuperAdmin) {
      return true;
    }
    
    if (user.rol === 'ADMIN' && !this.isCurrentUserSuperAdmin) {
      return true;
    }

    if (user.is_superuser && this.isCurrentUserSuperAdmin) {
      return true;
    }
    
    return false;
  }
}